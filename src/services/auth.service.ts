import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';
import {MenuDelRolRepository, MenuRepository} from '../repositories';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @repository(MenuDelRolRepository)
    private repositorioRolMenu: MenuDelRolRepository,
    @repository(MenuRepository)
    private repositorioMenu: MenuRepository
  ) { }

  // Mantiene el nombre legado para compatibilidad con los controladores existentes.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async VerificarPermisoDeUsuarioPorRol(
    idRol: number,
    menuRef: number | string,
    accion: string
  ): Promise<UserProfile | undefined> {
    const idMenu = await this.obtenerIdMenu(menuRef);
    const permiso = await this.repositorioRolMenu.findOne({
      where: {
        rolId: idRol,
        menuId: idMenu
      }
    });
    let continuar: boolean = false;
    if (permiso) {
      switch (accion) {
        case 'guardar':
          continuar = permiso.Guardar;
          break;
        case 'editar':
          continuar = permiso.Editar;
          break;
        case 'eliminar':
          continuar = permiso.Eliminar;
          break;
        case 'listar':
          continuar = permiso.Listar;
          break;
        case 'descargar':
          continuar = permiso.Descargar;
          break;
        default:
          throw new HttpErrors.BadRequest('No es posible realizar la acción porque no existe');
      }
      if (continuar) {
        const perfil: UserProfile = Object.assign({
          permitido: 'OK',
        });
        return perfil;
      } else {
        throw new HttpErrors.Forbidden('No es posible ejecutar la acción por falta de permisos');
      }
    } else {
      throw new HttpErrors.Forbidden("No es posible ejecutar la acción por falta de permisos");
    }
  }

  private async obtenerIdMenu(menuRef: number | string): Promise<number> {
    if (typeof menuRef === 'number' && Number.isFinite(menuRef)) {
      return menuRef;
    }

    const menuComoTexto = String(menuRef).trim();
    if (!menuComoTexto) {
      throw new HttpErrors.BadRequest('No se recibió una referencia de menú válida.');
    }

    if (/^\d+$/.test(menuComoTexto)) {
      return Number(menuComoTexto);
    }

    const menu = await this.repositorioMenu.findOne({
      where: {
        Nombre: {
          like: menuComoTexto,
        },
      },
    });

    if (!menu?.id) {
      throw new HttpErrors.BadRequest(
        `No existe un menú con el nombre '${menuComoTexto}'.`
      );
    }

    return menu.id;
  }
}
