import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  Credenciales,
  Empleado,
  MenuDelRol,
} from '../models';
import {
  EmpleadoRepository,
  MenuDelRolRepository,
} from '../repositories';
const MD5 = require('crypto-js/MD5');

@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadUsuarioService {
  constructor(
    @repository(EmpleadoRepository)
    public repositoriUsuario: EmpleadoRepository,
    @repository(MenuDelRolRepository)
    public repositoryRolMenu: MenuDelRolRepository,
  ) {}

  /**
   * La función cifrarTexto toma una cadena como entrada, la cifra usando el
   * algoritmo MD5 y devuelve la cadena cifrada.
   * @param {string} clave - El parámetro "clave" es una cadena que representa la
   * clave utilizada para el cifrado.
   * @returns el texto cifrado (cadenaCifrada) tras aplicar el algoritmo de cifrado
   * MD5 a la clave de entrada.
   */
  cifrarTexto(clave: string): string {
    let cadenaCifrada = MD5(clave).toString();
    return cadenaCifrada;
  }

  GeneralTextoAleatorio(n: number): string {
    let caracteres = 'abcdefghijkmnpqrtuvwxyzABCDEFGHIJKLMNPQRTUVWXYZ2346789';
    let clave = '';
    for (let i = 0; i < n; i++)
      clave += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    return clave;
  }


  ObtenerRolDesdeUsuario(request: any): number {
    let usuario = request.user;
    let idRol = usuario.rolId;
    return idRol;
  }

  /**
   * La función `identificarUsuario` toma las credenciales y devuelve un objeto de
   * usuario si las credenciales coinciden, de lo contrario devuelve nulo.
   * @param {Credenciales} credenciales - El parámetro "credenciales" es de tipo
   * "Credenciales". Es un objeto que contiene las credenciales del usuario,
   * específicamente su dirección de correo electrónico y contraseña.
   * @returns una Promesa que se resuelve en un objeto Usuario o nula.
   */
  async identificarUsuario(
    credenciales: Credenciales,
  ): Promise<Empleado | null> {
    let empleado = await this.repositoriUsuario.findOne({
      where: {
        Correo: credenciales.correo,
        Clave: credenciales.clave,
      },
    });
    return empleado as Empleado;
  }


  async ConsultarPermisosDeMenuPorUsuario(idRol: number): Promise<MenuDelRol[]> {
    let menu: MenuDelRol[] = await this.repositoryRolMenu.find({
      where: {
        Listar: true,
        rolId: idRol,
      },
    });
    return menu;
  }

  //necesito un metodo que dado un correo, me busque en la base de datos, si el correo esta en la base me muestre un error
  //si el correo no esta en la base me permita crear un usuario nuevo
  async buscarUsuarioPorCorreo(correo: string): Promise<Empleado | null> {
    let empleado = await this.repositoriUsuario.findOne({
      where: {
        Correo: correo,
      },
    });
    return empleado as Empleado;
  }
}
