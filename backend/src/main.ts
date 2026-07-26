import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Allow the React simulator to query the core system endpoints
    app.enableCors();
    await app.listen(3000);
}
bootstrap();