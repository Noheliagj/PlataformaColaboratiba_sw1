import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { GeneratorModule } from './generator/generator.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { IaModule } from './ia/ia.module';
import { XmiModule } from './xmi/xmi.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    GeneratorModule,
    WebsocketsModule,
    IaModule,
    XmiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
