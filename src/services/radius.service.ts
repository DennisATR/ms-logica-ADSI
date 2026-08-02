import {BindingScope, injectable} from '@loopback/core';
const mysql = require('mysql2/promise');

@injectable({scope: BindingScope.TRANSIENT})
export class RadiusService {
  private getDbConfig() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin',
      database: 'radius',
    };
  }

  /**
   * Genera y crea un nuevo usuario en la base de datos RADIUS.
   * - Usuario RADIUS: Primer nombre + número consecutivo (ej: Dennis1)
   * - Contraseña RADIUS: 6 dígitos numéricos aleatorios
   * - Atributos radcheck: Cleartext-Password, Simultaneous-Use := 1
   * - Atributos radreply: Acct-Interim-Interval := 180, Idle-Timeout := 60
   */
  async crearUsuarioRadius(nombre: string): Promise<{radiusUser: string; radiusClave: string}> {
    let connection;
    try {
      connection = await mysql.createConnection(this.getDbConfig());

      // 1. Obtener primer nombre y limpiar caracteres no ASCII / tipográficos
      const palabras = nombre ? nombre.trim().split(/\s+/) : [];
      const primerNombreRaw = palabras.length > 0 && palabras[0] ? palabras[0] : 'usuario';
      const nombreLimpio = primerNombreRaw
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '');
      
      const baseName = (nombreLimpio || 'Usuario').charAt(0).toUpperCase() + (nombreLimpio || 'Usuario').slice(1).toLowerCase();

      // 2. Buscar usuarios existentes con ese prefijo en radcheck
      const [rows]: [any[], any] = await connection.query(
        'SELECT DISTINCT username FROM radcheck WHERE username LIKE ?',
        [`${baseName}%`],
      );

      let maxNum = 0;
      const regex = new RegExp(`^${baseName}(\\d+)$`, 'i');

      for (const row of rows) {
        const usernameStr = row.username;
        if (usernameStr.toLowerCase() === baseName.toLowerCase()) {
          if (maxNum < 1) maxNum = 0;
        }
        const match = usernameStr.match(regex);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }

      const nextNum = maxNum + 1;
      const radiusUser = `${baseName}${nextNum}`;

      // 3. Generar clave numérica aleatoria de 6 dígitos
      const radiusClave = Math.floor(100000 + Math.random() * 900000).toString();

      // 4. Insertar en radcheck
      await connection.query(
        'INSERT INTO radcheck (username, attribute, op, value) VALUES (?, ?, ?, ?)',
        [radiusUser, 'Cleartext-Password', ':=', radiusClave],
      );

      await connection.query(
        'INSERT INTO radcheck (username, attribute, op, value) VALUES (?, ?, ?, ?)',
        [radiusUser, 'Simultaneous-Use', ':=', '1'],
      );

      // 5. Insertar en radreply
      await connection.query(
        'INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ?, ?)',
        [radiusUser, 'Port-Limit', ':=', '1'],
      );

      await connection.query(
        'INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ?, ?)',
        [radiusUser, 'Acct-Interim-Interval', ':=', '180'],
      );

      await connection.query(
        'INSERT INTO radreply (username, attribute, op, value) VALUES (?, ?, ?, ?)',
        [radiusUser, 'Idle-Timeout', ':=', '60'],
      );

      return {radiusUser, radiusClave};
    } catch (error) {
      console.error('Error al crear usuario en base de datos RADIUS:', error);
      throw error;
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
}
