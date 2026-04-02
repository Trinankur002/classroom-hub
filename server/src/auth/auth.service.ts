import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../users/entities/role.enum';
import { User } from 'src/users/entities/user.entity';
import { ChangePasswordDto } from './dto/changePassword.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { randomInt } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordResetOtp } from './entities/password-reset-otp.entity';
import { Repository, MoreThan } from 'typeorm';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(PasswordResetOtp)
    private passwordResetOtpRepository: Repository<PasswordResetOtp>,
  ) {}

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

    const payload = { sub: user.id, email: user.email, role: user.role };
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

    const payload = { sub: user.id, email: user.email, role: user.role };
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

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = forgotPasswordDto.email.trim().toLowerCase();
    const genericResponse = {
      message:
        'If an account with that email exists, a password reset OTP has been sent.',
    };

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      this.logger.warn('Password reset requested for a non-existent account');
      return genericResponse;
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const requestCount = await this.passwordResetOtpRepository.count({
      where: {
        userId: user.id,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (requestCount >= 3) {
      this.logger.warn(`Password reset rate limit reached for userId=${user.id}`);
      return genericResponse;
    }

    await this.passwordResetOtpRepository.update(
      { userId: user.id, used: false },
      { used: true },
    );

    const otp = this.generateSixDigitOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const otpRecord = this.passwordResetOtpRepository.create({
      userId: user.id,
      otpHash,
      expiresAt,
      used: false,
    });

    await this.passwordResetOtpRepository.save(otpRecord);

    try {
      await this.emailService.sendOtpEmail(user.email, otp);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP for userId=${user.id}`,
        error instanceof Error ? error.stack : String(error),
      );
      return genericResponse;
    }

    this.logger.log(`Password reset OTP issued for userId=${user.id}`);

    return genericResponse;
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ access_token: string }> {
    const normalizedEmail = resetPasswordDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new BadRequestException('Invalid OTP or expired OTP');
    }

    await this.validatePasswordResetOtp(user.id, resetPasswordDto.otp);

    await this.usersService.setPasswordById(user.id, resetPasswordDto.newPassword);
    await this.passwordResetOtpRepository.update({ userId: user.id }, { used: true });

    this.logger.log(`Password reset completed for userId=${user.id}`);

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async verifyResetOtp(
    verifyResetOtpDto: VerifyResetOtpDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = verifyResetOtpDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new BadRequestException('Invalid OTP or expired OTP');
    }

    await this.validatePasswordResetOtp(user.id, verifyResetOtpDto.otp);

    return { message: 'OTP verified successfully' };
  }

  private generateSixDigitOtp(): string {
    return randomInt(0, 1000000).toString().padStart(6, '0');
  }

  private async validatePasswordResetOtp(
    userId: string,
    otp: string,
  ): Promise<PasswordResetOtp> {
    const otpRecord = await this.passwordResetOtpRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    if (!otpRecord || otpRecord.used || otpRecord.expiresAt < new Date()) {
      throw new BadRequestException('Invalid OTP or expired OTP');
    }

    const isOtpValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP or expired OTP');
    }

    return otpRecord;
  }
}
