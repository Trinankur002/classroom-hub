import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../users/entities/role.enum';
import { User } from 'src/users/entities/user.entity';
import { ChangePasswordDto } from './dto/changePassword.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async signUp(signUpDto: SignUpDto): Promise<{ access_token: string }> {
    const { name, email, password, role: rawRole } = signUpDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Normalize and validate requested role (only allow Teacher or Student from client)
    const normalizeRole = (r?: string): Role | undefined => {
      if (!r) return undefined;
      const v = r.toString().trim().toLowerCase();
      if (v === 'teacher') return Role.Teacher;
      if (v === 'student') return Role.Student;
      return undefined;
    };

    const requestedRole = normalizeRole(rawRole);

    if (rawRole && !requestedRole) {
      throw new BadRequestException('Invalid role. Allowed values: teacher, student');
    }

    const userCount = await this.usersService.count();

    // First user in the system remains SystemUser
    const finalRole =
      userCount === 0 ? Role.SystemUser : requestedRole ?? Role.Student;

    const user = await this.usersService.create({
      name,
      email,
      password,
      role: finalRole,
    });

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async updateAvater(user: User, file?: Express.Multer.File) {
    const userWithAvatar = await this.usersService.updateAvatar(user, file);
    return {
      id: userWithAvatar.id,
      name: userWithAvatar.name,
      email: userWithAvatar.email,
      role: userWithAvatar.role,
      avatarUrl: userWithAvatar.avatarUrl,
      createdAt: userWithAvatar.createdAt
    }
  }

  async changePassword(user: User, data: ChangePasswordDto) {
    const updatedUser = await this.usersService.changePassword(user, data);
    const payload = { sub: updatedUser.id, email: updatedUser.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

}
