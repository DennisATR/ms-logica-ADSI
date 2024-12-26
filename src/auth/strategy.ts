import {
  AuthenticationBindings,
  AuthenticationMetadata,
  AuthenticationStrategy,
} from '@loopback/authentication';
import {inject, service} from '@loopback/core';
import {Request} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {AuthService, SeguridadUsuarioService} from '../services';

export class AuthStrategy implements AuthenticationStrategy {
  name: string = 'auth';

  constructor(
    @service(SeguridadUsuarioService)
    private servicioSeguridad: SeguridadUsuarioService,
    @inject(AuthenticationBindings.METADATA)
    private metadata: AuthenticationMetadata[],
    @service(AuthService)
    private servivioAuth: AuthService
  ) {}

  /**
   * Atenticación deun usuario frente a una acción en la base de datos.
   * @param request la solicitud con el token
   * @returns el perfil de usuacio, undefined cuando no se tiene el permiso o httpError
   */
  async authenticate(request: Request): Promise<UserProfile | undefined> {
    let idRol = this.servicioSeguridad.ObtenerRolDesdeUsuario(request);
    let idMenu: number = this.metadata[0].options![0];
    let accion: string = this.metadata[0].options![1];
      try{
        let res = await this.servivioAuth.VerificarPermisoDeUsuarioPorRol(idRol, idMenu, accion);
        return res;
      }catch(e){
        throw e;
    }
  }
}
