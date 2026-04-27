import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { IUser } from 'src/modules/users/interface/user.interface';
import { ApiConfigService } from 'src/shared';
import { RolesService } from 'src/modules/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ApiConfigService,
    private roleService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.authConfig.access_token_key,
    });
  }

  async validate(payload: IUser) {
    const { userId, fullName, email, roleId, gender, roleName, avatarUrl } = payload;
    const temp = await this.roleService.findOne(roleId);

    return {
      userId,
      email,
      roleId,
      roleName,
      fullName,
      gender,
      avatarUrl,
      permissions: temp?.role?.permissons ?? [],
    };
  }
}
