import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../../entities/user-session.entity';
import { 
  CreateSessionData, 
  IUserSessionFrontendService, 
  UpdateSessionData 
} from '../../interfaces/user-session-services.interface';

@Injectable()
export class UserSessionFrontendService implements IUserSessionFrontendService {
  private readonly logger = new Logger(UserSessionFrontendService.name);
  private readonly DEFAULT_SESSION_TTL = 86400; // 24 giờ (tính bằng giây)

  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async startSession(data: CreateSessionData): Promise<UserSession> {
    try {
      // Kiểm tra xem session đã tồn tại chưa
      const existingSession = await this.userSessionRepository.findOne({
        where: { sessionId: data.sessionId }
      });

      // Tính thời gian hết hạn
      const ttl = data.ttl || this.DEFAULT_SESSION_TTL;
      const expireAt = new Date();
      expireAt.setSeconds(expireAt.getSeconds() + ttl);

      if (existingSession) {
        // Nếu đã tồn tại và không active, thì reactive lại
        if (!existingSession.isActive) {
          existingSession.isActive = true;
          existingSession.lastActivity = new Date();
          existingSession.expireAt = expireAt;
          existingSession.updatedAt = new Date();
          return this.userSessionRepository.save(existingSession);
        }
        
        // Nếu đã tồn tại và active, cập nhật expireAt và trả về session hiện tại
        existingSession.expireAt = expireAt;
        existingSession.updatedAt = new Date();
        return this.userSessionRepository.save(existingSession);
      }

      // Tạo session mới
      const session = this.userSessionRepository.create({
        sessionId: data.sessionId,
        userId: data.userId || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        startTime: new Date(),
        lastActivity: new Date(),
        expireAt: expireAt,
        isActive: true,
        totalTime: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return this.userSessionRepository.save(session);
    } catch (error) {
      this.logger.error(`Error starting session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSession(sessionId: string, data: UpdateSessionData): Promise<UserSession | null> {
    try {
      // Log dữ liệu nhận được
      this.logger.debug(`Updating session ${sessionId} with data: ${JSON.stringify({
        lastActivity: data.lastActivity ? String(data.lastActivity) : 'undefined',
        isActive: data.isActive,
        ipAddress: data.ipAddress || 'not provided' // Log IP address nếu có
      })}`);

      const session = await this.userSessionRepository.findOne({
        where: { sessionId, isActive: true },
      });

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found or not active`);
        return null;
      }

      // Convert lastActivity to Date if it's a string
      let currentTime: Date;
      if (!data.lastActivity) {
        currentTime = new Date();
      } else if (typeof data.lastActivity === 'string') {
        try {
          currentTime = new Date(data.lastActivity);
          if (isNaN(currentTime.getTime())) {
            this.logger.warn(`Invalid date string received: ${data.lastActivity}, using current time instead`);
            currentTime = new Date();
          }
        } catch (error) {
          this.logger.error(`Error parsing date string: ${error.message}`);
          currentTime = new Date();
        }
      } else {
        currentTime = data.lastActivity;
      }

      // Log thời gian sau khi chuyển đổi
      this.logger.debug(`currentTime after conversion: ${currentTime.toISOString()}`);

      const lastActivity = session.lastActivity;
      const diffSeconds = Math.floor((currentTime.getTime() - lastActivity.getTime()) / 1000);
      
      // Log các giá trị để debug 
      this.logger.debug(`lastActivity from DB: ${lastActivity.toISOString()}`);
      this.logger.debug(`Calculated diffSeconds: ${diffSeconds}`);
      
      // Cập nhật tổng thời gian nếu hợp lý (không quá 1 giờ giữa các lần cập nhật)
      if (diffSeconds > 0 && diffSeconds < 3600) {
        this.logger.debug(`Updating totalTime: ${session.totalTime} + ${diffSeconds} = ${session.totalTime + diffSeconds}`);
        session.totalTime += diffSeconds;
      } else {
        this.logger.debug(`Not updating totalTime because diffSeconds (${diffSeconds}) is not between 0 and 3600`);
      }
      
      // Cập nhật lastActivity
      session.lastActivity = currentTime;

      // Cập nhật trạng thái active
      if (data.isActive !== undefined) {
        session.isActive = data.isActive;
      }

      // Cập nhật thời gian hết hạn nếu được chỉ định
      if (data.expireAt) {
        session.expireAt = data.expireAt;
      }

      // Cập nhật IP address nếu được cung cấp và thực sự thay đổi
      if (data.ipAddress && data.ipAddress !== session.ipAddress) {
        this.logger.debug(`Updating IP address from ${session.ipAddress} to ${data.ipAddress}`);
        session.ipAddress = data.ipAddress;
      }

      session.updatedAt = new Date();

      // Lưu session và return kết quả
      const updatedSession = await this.userSessionRepository.save(session);
      this.logger.debug(`Session updated successfully: totalTime=${updatedSession.totalTime}, lastActivity=${updatedSession.lastActivity}, ipAddress=${updatedSession.ipAddress}`);
      return updatedSession;
    } catch (error) {
      this.logger.error(`Error updating session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async refreshSession(sessionId: string, ttl?: number): Promise<UserSession | null> {
    try {
      const session = await this.userSessionRepository.findOne({
        where: { sessionId },
      });

      if (!session) {
        return null;
      }

      // Cập nhật thời gian hết hạn
      const sessionTtl = ttl || this.DEFAULT_SESSION_TTL;
      const expireAt = new Date();
      expireAt.setSeconds(expireAt.getSeconds() + sessionTtl);
      
      session.expireAt = expireAt;
      session.lastActivity = new Date();
      session.isActive = true;
      session.updatedAt = new Date();

      return this.userSessionRepository.save(session);
    } catch (error) {
      this.logger.error(`Error refreshing session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<UserSession | null> {
    try {
      const session = await this.userSessionRepository.findOne({
        where: { sessionId, isActive: true },
      });

      if (!session) {
        return null;
      }

      // Tính thời gian phiên
      const currentTime = new Date();
      const lastActivity = session.lastActivity;
      const diffSeconds = Math.floor((currentTime.getTime() - lastActivity.getTime()) / 1000);
      
      // Cập nhật tổng thời gian
      if (diffSeconds > 0 && diffSeconds < 3600) {
        session.totalTime += diffSeconds;
      }

      session.isActive = false;
      session.lastActivity = currentTime;
      session.updatedAt = currentTime;

      return this.userSessionRepository.save(session);
    } catch (error) {
      this.logger.error(`Error ending session: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    return this.userSessionRepository.findOne({
      where: { sessionId },
      relations: ['pageVisits'],
    });
  }

  async getActiveUserCount(): Promise<number> {
    return this.userSessionRepository.count({
      where: { isActive: true },
    });
  }
} 
