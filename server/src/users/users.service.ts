import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuid } from 'uuid';
import { getBucket } from 'src/fileServices/gcs.config';
import { FileEntity } from 'src/fileServices/file.entity';
import { ChangePasswordDto } from 'src/auth/dto/changePassword.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async count(): Promise<number> {
    return this.usersRepository.count();
  }

  async changePassword(user: User, data: ChangePasswordDto) {
    const { oldPassword, newPassword } = data;
    const exixtingUser = await this.findByEmail(user.email);

    if (!exixtingUser || !(await bcrypt.compare(oldPassword, exixtingUser.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    exixtingUser.password = newPassword;
    return this.usersRepository.save(exixtingUser);
  }

  async updateAvatar(user: User, file?: Express.Multer.File): Promise<User> {
    return await this.usersRepository.manager.transaction(async (manager) => {
      const me = await manager.findOne(User, { where: { id: user.id } });

      if (!me) {
        throw new Error(`User with id ${user.id} not found`);
      }

      if (!file) {
        return await manager.save(me);
      }

      const fileKey = `${uuid()}-${file.originalname}`;

      // get GCS bucket
      const gcsBucket = getBucket();
      if (!gcsBucket) {
        throw new Error("GCS bucket not configured (getBucket() returned falsy)");
      }

      const blob = gcsBucket.file(fileKey);

      try {
        await blob.save(file.buffer, {
          contentType: file.mimetype,
          resumable: false,
        });

        const [url] = await blob.getSignedUrl({
          action: "read",
          expires: Date.now() + 18250 * 24 * 60 * 60 * 1000,
        });


        const fileEntity = manager.create(FileEntity, {
          name: file.originalname,
          role: me.role ?? user.role,
          userId: user.id,
          key: fileKey,
          url,
          size: file.size,
          mimetype: file.mimetype,
        });

        await manager.save(fileEntity);
        me.avatarUrl = url;
        return await manager.save(me);

      } catch (err) {
        throw new Error(`Failed to upload avatar: ${err instanceof Error ? err.message : String(err)}`);
      }
    });
  }

}
