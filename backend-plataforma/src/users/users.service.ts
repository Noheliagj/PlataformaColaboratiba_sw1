import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

/**
 * Acceso a la tabla de usuarios. Encapsula el hasheo de contraseña
 * para que ningún otro módulo guarde contraseñas en texto plano.
 */
@Injectable()
export class UsersService {
  private static readonly SALT_ROUNDS = 10;

  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    const password = await bcrypt.hash(input.password, UsersService.SALT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        password,
      },
    });
  }
}
