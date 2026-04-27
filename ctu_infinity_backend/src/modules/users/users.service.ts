import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { RegisterUserDto } from './dto/register-user.dto';
import { IUser } from 'src/modules/users/interface/user.interface';
import { UpdateUserDto } from 'src/modules/users/dto/update-user.dto';
import aqp from 'api-query-params';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateBasicInfoDto } from './dto/update-basic-info.dto';

export type AccountType = 'STUDENT' | 'ORGANIZER' | 'USER';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    try {
      const isUserExist = await this.usersRepository.findOne({
        where: {
          email: createUserDto.email,
        },
      });

      if (isUserExist) {
        return {
          EC: 2,
          EM: `Email: ${createUserDto.email} already exists in the system. Please use a different email.`,
        };
      } else {
        const hasedPassword = this.getHashPassword(createUserDto.password);

        const newuser = this.usersRepository.create({
          ...createUserDto,
          password: hasedPassword,
        });
        await this.usersRepository.save(newuser);
        return {
          EC: 1,
          EM: 'Create user success',
          userId: newuser.userId,
          createdAt: newuser.createdAt,
        };
      }
    } catch (error) {
      console.error('Error in create user:', error.message);
      console.log('check erro create usser', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from create user service',
      });
    }
  }

  async findAll() {
    try {
      const listUsers = await this.usersRepository.find({});
      return {
        EC: 1,
        EM: 'Get all users success',
        users: listUsers,
      };
    } catch (error) {
      console.error('Error in getAll user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAll user service',
      });
    }
  }

  async findOne(id: string) {
    try {
      const userData = await this.usersRepository.findOne({
        where: { userId: id },
        relations: ['role'],
        select: {
          role: {
            roleId: true,
            roleName: true,
          },
        },
      });

      if (!userData) {
        throw new BadRequestException({
          EC: 0,
          EM: 'User Not Found',
        });
      } else {
        return {
          EC: 1,
          EM: 'Get user success',
          ...userData,
          roleName: userData.role.roleName,
        };
      }
    } catch (error) {
      console.error('Error in findOne user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from findOne User service',
      });
    }
  }

  async update(updateUser: UpdateUserDto, user: IUser) {
    console.log('check data update: ', updateUser);
    try {
      const updated = await this.usersRepository.update(
        {
          userId: updateUser.userId,
        },
        {
          ...updateUser,
          updatedBy: user.userId,
          updatedAt: new Date(),
        },
      );

      if (updated.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      }

      return {
        EC: 1,
        EM: 'Update user success',
        ...updated,
      };
    } catch (error: any) {
      console.error('Error in update user:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from update user service',
      });
    }
  }
  async updateProfile(updateUser: UpdateProfileDto, user: IUser) {
    console.log('check data update: ', updateUser);
    try {
      const updated = await this.usersRepository.update(
        {
          userId: updateUser.userId,
        },
        {
          ...updateUser,
          updatedBy: user.userId,
          updatedAt: new Date(),
        },
      );

      if (updated.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      }

      return {
        EC: 1,
        EM: 'updateProfile user success',
        ...updated,
      };
    } catch (error: any) {
      console.error('Error in updateProfile user:', error);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateProfile user service',
      });
    }
  }

  async remove(id: string, user: IUser) {
    try {
      const foundUser = await this.usersRepository.findOne({
        where: { userId: id },
      });

      if (!foundUser) {
        throw new BadRequestException({
          EC: 0,
          EM: 'not found user',
        });
      }

      if (foundUser && foundUser.email === 'admin@gmail.com') {
        return { EC: 0, EM: 'CAN NOT DELETE ADMIN ACCOUNT : admin@gmail.com' };
      }

      const deleted = await this.usersRepository.update(
        { userId: id },
        {
          isDeleted: true,
          deletedBy: user.userId,
          deletedAt: new Date(),
        },
      );

      if (deleted.affected === 0) {
        return {
          EC: 0,
          EM: 'user not found',
        };
      } else {
        return {
          EC: 1,
          EM: `user is deleted`,
          userId: id,
        };
      }
    } catch (error) {
      console.error('Error in delete user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from delete user service',
      });
    }
  }

  async findOneByUserName(userName: string) {
    return this.usersRepository.findOne({
      where: { email: userName },
      select: {
        email: true,
        password: true,
        userId: true,
        roleId: true,
        fullName: true,
        gender: true,
        avatarUrl: true,
      },
    });
  }

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash);
  }

  // async findUserByRefreshToken(refresh_token: string) {
  //   return await this.usersRepository.findOne({
  //     where: { refreshToken: refresh_token },
  //   });
  // }

  async findUserByRefreshToken(refresh_token: string) {
    const user = await this.usersRepository.findOne({
      where: { refreshToken: refresh_token },
      relations: ['role'],
    });

    const roleName = user?.role.roleName;
    if (!user) return null;
    return {
      ...user,
      roleName,
    };
  }

  async updateUserToken(refresh_token: string, id: string) {
    return await this.usersRepository.update({ userId: id }, { refreshToken: refresh_token });
  }

  async register(user: RegisterUserDto) {
    try {
      // const { email, password, genderCode, phoneNumber, age, fullName, roleId } = user;
      const { email, password, fullName } = user;
      const isUserExist = await this.usersRepository.findOne({
        where: { email: email },
      });

      if (isUserExist) {
        return {
          EC: 0,
          EM: `Email: ${email} already exists in the system. Please use a different email.`,
        };
      } else {
        const hashedPassword = this.getHashPassword(password);
        const newUser = this.usersRepository.create({
          email,
          fullName,
          password: hashedPassword,
          // genderCode,
          // phoneNumber,
          // age,
          // roleId: 3,
        });

        await this.usersRepository.save(newUser);
        return {
          EC: 1,
          EM: 'User register success',
          newUser,
        };
      }
    } catch (error) {
      console.error('Error in register user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from register user service',
      });
    }
  }

  async getUsersWithPagination(currentPage: number, limit: number, qs: string) {
    try {
      const { filter, sort } = aqp(qs);
      delete filter.current;
      delete filter.pageSize;
      const offset = (+currentPage - 1) * +limit;
      const defaultLimit = +limit ? +limit : 10;
      const totalItems = (await this.usersRepository.find(filter)).length;
      const totalPages = Math.ceil(totalItems / defaultLimit);
      const result = await this.usersRepository.find({
        where: filter,
        skip: offset,
        take: defaultLimit,
        order: sort,
      });

      return {
        EC: 1,
        EM: 'Get user with pagination success',
        metaData: {
          current: currentPage,
          pageSize: limit,
          totalPages: totalPages,
          totalItems: totalItems,
        },
        users: result,
      };
    } catch (error) {
      console.error('Error in getUsersWithPagination user:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUsersWithPagination service',
      });
    }
  }

  async getAllUsersWithProfiles(
    page: number = 1,
    limit: number = 10,
    accountType?: string,
  ) {
    try {
      const skip = (page - 1) * limit;

      let qb = this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.student', 'student')
        .leftJoinAndSelect('student.class', 'class')
        .leftJoinAndSelect('class.major', 'major')
        .leftJoinAndSelect('major.falculty', 'falculty')
        .leftJoinAndSelect('user.organizer', 'organizer')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.isDeleted = :isDeleted', { isDeleted: false })
        .select([
          'user.userId',
          'user.email',
          'user.fullName',
          'user.phoneNumber',
          'user.avatarUrl',
          'user.gender',
          'user.birthDate',
          'user.age',
          'user.roleId',
          'user.isDeleted',
          'user.createdAt',
          'user.updatedAt',
          'role.roleId',
          'role.roleName',
          'student.studentId',
          'student.studentCode',
          'student.enrollmentYear',
          'student.classId',
          'class.classId',
          'class.className',
          'major.majorId',
          'major.majorName',
          'falculty.falcultyId',
          'falculty.falcultyName',
          'organizer.organizerId',
          'organizer.organizerName',
          'organizer.description',
        ]);

      if (accountType === 'student') {
        qb = qb.andWhere('student.studentId IS NOT NULL');
      } else if (accountType === 'organizer') {
        qb = qb.andWhere('organizer.organizerId IS NOT NULL');
      } else if (accountType === 'user') {
        qb = qb
          .andWhere('student.studentId IS NULL')
          .andWhere('organizer.organizerId IS NULL');
      }

      const totalItems = await qb.getCount();

      const users = await qb
        .orderBy('user.createdAt', 'DESC')
        .skip(skip)
        .take(limit)
        .getMany();

      const usersWithAccountType = users.map((u) => ({
        ...u,
        accountType: u.student
          ? ('STUDENT' as AccountType)
          : u.organizer
            ? ('ORGANIZER' as AccountType)
            : ('USER' as AccountType),
      }));

      return {
        EC: 1,
        EM: 'Get all users with profiles success',
        users: usersWithAccountType,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
        },
      };
    } catch (error) {
      console.error('Error in getAllUsersWithProfiles:', error.message);
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getAllUsersWithProfiles service',
      });
    }
  }

  async getUserDetailWithProfile(userId: string) {
    try {
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.student', 'student')
        .leftJoinAndSelect('student.class', 'class')
        .leftJoinAndSelect('class.major', 'major')
        .leftJoinAndSelect('major.falculty', 'falculty')
        .leftJoinAndSelect('user.organizer', 'organizer')
        .leftJoinAndSelect('user.role', 'role')
        .where('user.userId = :userId', { userId })
        .select([
          'user.userId',
          'user.email',
          'user.fullName',
          'user.phoneNumber',
          'user.avatarUrl',
          'user.gender',
          'user.birthDate',
          'user.age',
          'user.roleId',
          'user.isDeleted',
          'user.createdAt',
          'user.updatedAt',
          'role.roleId',
          'role.roleName',
          'student.studentId',
          'student.studentCode',
          'student.enrollmentYear',
          'student.classId',
          'class.classId',
          'class.className',
          'major.majorId',
          'major.majorName',
          'falculty.falcultyId',
          'falculty.falcultyName',
          'organizer.organizerId',
          'organizer.organizerName',
          'organizer.description',
        ])
        .getOne();

      if (!user) {
        throw new NotFoundException({ EC: 0, EM: 'User not found' });
      }

      const accountType: AccountType = user.student
        ? 'STUDENT'
        : user.organizer
          ? 'ORGANIZER'
          : 'USER';

      return {
        EC: 1,
        EM: 'Get user detail success',
        user: { ...user, accountType },
      };
    } catch (error) {
      console.error('Error in getUserDetailWithProfile:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from getUserDetailWithProfile service',
      });
    }
  }

  async updateUserBasicInfo(userId: string, dto: UpdateBasicInfoDto, operator: IUser) {
    try {
      const found = await this.usersRepository.findOne({ where: { userId } });
      if (!found) {
        throw new NotFoundException({ EC: 0, EM: 'User not found' });
      }

      await this.usersRepository.update(
        { userId },
        { ...dto, updatedBy: operator.userId, updatedAt: new Date() },
      );

      return { EC: 1, EM: 'Update user basic info success', userId };
    } catch (error) {
      console.error('Error in updateUserBasicInfo:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from updateUserBasicInfo service',
      });
    }
  }

  async softDeleteUser(userId: string, operator: IUser) {
    try {
      const found = await this.usersRepository.findOne({ where: { userId } });
      if (!found) {
        throw new NotFoundException({ EC: 0, EM: 'User not found' });
      }
      if (found.email === 'admin@gmail.com') {
        return { EC: 0, EM: 'Cannot delete admin account' };
      }

      await this.usersRepository.update(
        { userId },
        { isDeleted: true, deletedAt: new Date(), deletedBy: operator.userId },
      );

      return { EC: 1, EM: 'Delete user success', userId };
    } catch (error) {
      console.error('Error in softDeleteUser:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from softDeleteUser service',
      });
    }
  }

  async restoreUser(userId: string, operator: IUser) {
    try {
      const found = await this.usersRepository.findOne({ where: { userId } });
      if (!found) {
        throw new NotFoundException({ EC: 0, EM: 'User not found' });
      }
      if (!found.isDeleted) {
        return { EC: 0, EM: 'User is not deleted' };
      }

      await this.usersRepository.update(
        { userId },
        { isDeleted: false, deletedAt: undefined, deletedBy: undefined, updatedBy: operator.userId },
      );

      return { EC: 1, EM: 'Restore user success', userId };
    } catch (error) {
      console.error('Error in restoreUser:', error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({
        EC: 0,
        EM: 'Error from restoreUser service',
      });
    }
  }
}

