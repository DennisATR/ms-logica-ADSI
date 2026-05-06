import {
  AuthenticationBindings,
  AuthenticationMetadata,
  AuthenticationStrategy,
} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import parseBearerToken from 'parse-bearer-token';
import {AuthService, SeguridadUsuarioService} from '../services';

export class AuthStrategy implements AuthenticationStrategy {
  name: string = 'auth';

  constructor(
    @service(SeguridadUsuarioService)
    private servicioSeguridad: SeguridadUsuarioService,
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
    @service(AuthService)
    private servicioAuth: AuthService
  ) { }

  /**
  * Autenticación de un usuario frente a una acción en la base de datos
  * @param request la solicitud con el token
  * @returns el perfil de usuario, undefined cuando no tiene permiso o un httpError
  */
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const token = parseBearerToken(request);
    if (!token) {
      throw new HttpErrors.Unauthorized('No es posible ejecutar la acción por falta de un token.');
    }

    if (!this.metadata || this.metadata.length === 0) {
      throw new HttpErrors.Unauthorized('No se encontró metadata de autorización.');
    }

    const opciones = this.metadata[0].options as unknown[] | undefined;
    const referenciaMenu = opciones?.[0];
    const accion = opciones?.[1] as string | undefined;

    if (!referenciaMenu || !accion) {
      throw new HttpErrors.BadRequest(
        'La metadata de autorización debe incluir [menuId|menuNombre, accion].'
      );
    }

    try {
      const idRol = this.servicioSeguridad.ObtenerRolDesdeToken(token as string);
      const res = await this.servicioAuth.VerificarPermisoDeUsuarioPorRol(
        idRol,
        referenciaMenu as string | number,
        accion
      );
      return res;
    } catch (e: unknown) {
      const nombreError =
        typeof e === 'object' && e !== null && 'name' in e
          ? String((e as {name?: string}).name)
          : '';
      if (nombreError === 'JsonWebTokenError' || nombreError === 'TokenExpiredError') {
        throw new HttpErrors.Unauthorized('Token inválido o expirado.');
      }
      throw e;
    }
  }
}
