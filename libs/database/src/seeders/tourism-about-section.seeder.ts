import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AboutSection, AboutSectionType } from '../../../../apps/backend/src/modules/about/entities/about-section.entity';
import { AboutSectionTranslation } from '../../../../apps/backend/src/modules/about/entities/about-section-translation.entity';

@Injectable()
export class TourismAboutSectionSeeder {
  private readonly logger = new Logger(TourismAboutSectionSeeder.name);

  constructor(
    @InjectRepository(AboutSection)
    private readonly sectionRepository: Repository<AboutSection>,
    @InjectRepository(AboutSectionTranslation)
    private readonly sectionTranslationRepository: Repository<AboutSectionTranslation>
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Starting tourism about section seeding...');

    const existingSections = await this.sectionRepository.count();

    if (existingSections > 0) {
      this.logger.log('Tourism about sections already exist, skipping seed');
      return;
    }

    try {
      // 1. Tourism Hero Section
      this.logger.log('Creating tourism hero section...');
      const heroSection = await this.createSection({
        type: AboutSectionType.TOURISM_HERO,
        componentName: 'TourismHeroSection',
        order: 1,
        settings: {
          layout: 'tourism',
          heroHeight: '600px',
          heroBackgroundImage: '/images/tourism/hero-bg.jpg',
          heroOverlayOpacity: 0.4,
          backgroundColor: '',
          textColor: 'text-white',
          padding: '0',
          animation: {
            enabled: true,
            type: 'fade',
            duration: 1000,
            delay: 0
          }
        }
      }, {
        vi: {
          title: 'Khám phá',
          subtitle: 'Khu du lịch Cáp treo Núi Sam',
          content: 'Điểm đến cho tất cả mọi người'
        },
        en: {
          title: 'Explore',
          subtitle: 'Sam Mountain Cable Car Tourist Area',
          content: 'A destination for everyone'
        }
      });

      // 2. Tourism Features Section
      this.logger.log('Creating tourism features section...');
      const featuresSection = await this.createSection({
        type: AboutSectionType.TOURISM_FEATURES,
        componentName: 'TourismFeaturesSection',
        order: 2,
        settings: {
          layout: 'grid',
          backgroundColor: 'bg-white',
          textColor: 'text-gray-900',
          padding: '4rem 0',
          animation: {
            enabled: true,
            type: 'fade-up',
            duration: 1000,
            delay: 200
          },
          features: [
            {
              title: 'Lăng Thoại Ngọc Hầu',
              image: 'https://cdn.captreonuisam.com/tourism/lang-thoai-ngoc-hau.jpg',
              link: '/bai-viet/kham-pha-lang-thoai-ngoc-hau-tuyet-tac-kien-truc-giua-long-nui-sam'
            },
            {
              title: 'Đền Phật Ngọc',
              image: 'https://cdn.captreonuisam.com/tourism/den-phat-ngoc.jpg',
              link: '/bai-viet/phat-ngoc-hoa-binh-the-gioi-tren-dinh-nui-sam'
            },
            {
              title: 'Nhà Ga Cáp Treo',
              image: 'https://cdn.captreonuisam.com/tourism/nha-ga-cap-treo.jpg',
              link: '/bai-viet/nha-ga-cap-treo-nui-sam'
            },
            {
              title: 'Rừng tràm Trà Sư',
              image: 'https://cdn.captreonuisam.com/tourism/rung-tram-tra-su.jpg',
              link: '/bai-viet/cam-nang-du-lich-rung-tram-tra-su'
            }
          ]
        }
      }, {
        vi: {
          title: 'Khám phá điểm đến',
          subtitle: 'Các địa điểm tham quan nổi bật',
          content: 'Khám phá những điểm đến độc đáo và ấn tượng tại khu du lịch Cáp treo Núi Sam',
          data: {
            description: 'Tại thời điểm hiện nay, dù đã đã đưa vào vận hành nhiều hạng mục, nhiều điểm tham quan đủ để giữ du khách đến với quần thể du lịch quốc gia Núi Sam, vừa để cúng viếng vừa kết hợp thưởng ngoạn, giải trí, vui chơi.'
          }
        },
        en: {
          title: 'Explore Destinations',
          subtitle: 'Featured Tourist Attractions',
          content: 'Discover unique and impressive destinations at Sam Mountain Cable Car Tourist Area',
          data: {
            description: 'Currently, although many items and attractions have been put into operation, they are enough to keep tourists coming to the Sam Mountain national tourism complex, both for worship and combined sightseeing, entertainment, and recreation.'
          }
        }
      });

      // 3. Tourism Cultural Section
      this.logger.log('Creating tourism cultural section...');
      const culturalSection = await this.createSection({
        type: AboutSectionType.TOURISM_CULTURAL,
        componentName: 'TourismCulturalSection',
        order: 3,
        settings: {
          layout: 'split',
          backgroundColor: 'bg-yellow-600',
          textColor: 'text-gray-900',
          padding: '4rem 0',
          animation: {
            enabled: true,
            type: 'fade-up',
            duration: 1000,
            delay: 200
          },
          imagePosition: 'right',
          images: [
            'https://cdn.captreonuisam.com/tourism/cultural-1.jpg',
            'https://cdn.captreonuisam.com/tourism/cultural-2.jpg'
          ]
        }
      }, {
        vi: {
          title: 'Tầm nhìn văn hóa tâm linh',
          subtitle: 'Giá trị văn hóa và tâm linh',
          content: `
            <p>Với <strong>tầm nhìn xa</strong> và <strong>tầm huyết</strong> của chủ đầu tư MGA trong hành trình mang về vùng đất An Giang những thắng cảnh, danh thắng hùng vĩ, hữu tình, nên thơ của đất nước.</p>

            <p>Khu du lịch Cáp treo Núi Sam còn nổi tụ những phong cảnh tuyệt đẹp với:</p>
            <ul>
              <li><em>Một Đà Lạt nên thơ</em> trong lòng Châu Đốc</li>
              <li><strong>Điện Dược Sư</strong> với kiến trúc ngôi chùa truyền thống đặt phương Nam</li>
              <li>Các cụm/điểm du lịch tâm linh đặc sắc</li>
              <li>Quảng trường với những lễ hội dân tộc đặc sắc</li>
            </ul>

            <p>Trung tâm hội chợ mua sắm hay <a href="/facilities/cable-car">Nhà ga cáp treo Núi Sam</a> được xây dựng đồng bộ và hiện đại mang đẳng cấp Nhà ga Cáp treo châu Âu...</p>`,
        },
        en: {
          title: 'Cultural and Spiritual Vision',
          subtitle: 'Cultural and Spiritual Values',
          content: `
            <p>With the <strong>far-sighted vision</strong> and <strong>dedication</strong> of MGA investors in the journey to bring to An Giang land the majestic, romantic, and poetic landscapes and attractions of the country.</p>

            <p>Sam Mountain Cable Car Tourist Area features beautiful scenery with:</p>
            <ul>
              <li><em>A poetic Da Lat</em> in the heart of Chau Doc</li>
              <li><strong>Medicine Buddha Temple</strong> with traditional temple architecture placed in the South</li>
              <li>Special spiritual tourism clusters/points</li>
              <li>Square with unique ethnic festivals</li>
            </ul>

            <p>Shopping fair center and <a href="/facilities/cable-car">Sam Mountain cable car station</a> was built synchronously and modernly with European Cable Car Station class...</p>`,
        }
      });

      // 4. Second Tourism Cultural Section (Left Image Position)
      this.logger.log('Creating second tourism cultural section...');
      const culturalSection2 = await this.createSection({
        type: AboutSectionType.TOURISM_CULTURAL,
        componentName: 'TourismCulturalSection',
        order: 4,
        settings: {
          layout: 'split',
          backgroundColor: 'bg-white',
          textColor: 'text-gray-900',
          padding: '4rem 0',
          animation: {
            enabled: true,
            type: 'fade-up',
            duration: 1000,
            delay: 200
          },
          imagePosition: 'left',
          images: [
            'https://cdn.captreonuisam.com/tourism/cultural-3.jpg',
            'https://cdn.captreonuisam.com/tourism/cultural-4.jpg'
          ]
        }
      }, {
        vi: {
          title: 'Trải nghiệm du lịch độc đáo',
          subtitle: 'Khám phá văn hóa địa phương',
          content: `
            <p>Khu du lịch Cáp treo Núi Sam không chỉ là <strong>điểm đến tâm linh</strong> mà còn là nơi du khách có thể trải nghiệm văn hóa địa phương đặc sắc.</p>

            <h3>Trải nghiệm đa dạng</h3>
            <ul>
              <li>Thưởng thức <em>ẩm thực đặc sản</em> địa phương</li>
              <li>Tham gia các <strong>hoạt động văn hóa truyền thống</strong></li>
              <li>Khám phá không gian văn hóa độc đáo</li>
            </ul>

            <h3>Cảnh quan tuyệt đẹp</h3>
            <p>Đặc biệt, <a href="/facilities/cable-car">hệ thống cáp treo hiện đại</a> giúp du khách có thể chiêm ngưỡng toàn cảnh vùng đất Thất Sơn huyền bí từ trên cao, tạo nên những trải nghiệm khó quên...</p>`,
        },
        en: {
          title: 'Unique Tourism Experience',
          subtitle: 'Explore Local Culture',
          content: `
            <p>Sam Mountain Cable Car Tourist Area is not just a <strong>spiritual destination</strong> but also a place where visitors can experience distinctive local culture.</p>

            <h3>Diverse Experiences</h3>
            <ul>
              <li>Enjoy local <em>specialty cuisine</em></li>
              <li>Participate in <strong>traditional cultural activities</strong></li>
              <li>Explore unique cultural spaces</li>
            </ul>

            <h3>Beautiful Landscapes</h3>
            <p>Notably, the <a href="/facilities/cable-car">modern cable car system</a> allows visitors to admire the panoramic view of the mysterious That Son region from above, creating unforgettable experiences...</p>`,
        }
      });

      // 5. Tourism Gallery Section
      this.logger.log('Creating tourism gallery section...');
      const gallerySection = await this.createSection({
        type: AboutSectionType.TOURISM_GALLERY,
        componentName: 'TourismGallerySection',
        order: 5,
        settings: {
          layout: 'grid',
          backgroundColor: 'bg-gray-50',
          textColor: 'text-gray-900',
          padding: '4rem 0',
          animation: {
            enabled: true,
            type: 'fade-up',
            duration: 1000,
            delay: 200
          },
          gallery: [
            {
              "image": "https://cdn.captreonuisam.com/tourism/be-ba-chua-xu.jpg",
              "title": "Bệ Bà Chúa Xứ",
              "category": "spiritual"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/den-phat-ngoc-hoa-binh.jpg",
              "title": "Đền Phật Ngọc Hoà Bình Thế Giới",
              "category": "spiritual"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/nha-ga-cap-treo-nui-sam.jpg",
              "title": "Nhà Ga Cáp Treo",
              "category": "infrastructure"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/bai-giu-xe.jpg",
              "title": "Bãi Giữ Xe Rộng Rãi",
              "category": "facility"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/chua-mot-cot.jpg",
              "title": "Chùa Một Cột",
              "category": "spiritual"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/phat-thien-thu.jpg",
              "title": "Phật Thiên Thủ Thiên Nhãn",
              "category": "spiritual"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/dien-phat-duoc-su.jpg",
              "title": "Điện Phật Dược Sư",
              "category": "spiritual"
            },
            {
              "image": "https://cdn.captreonuisam.com/tourism/dai-vong-canh.jpg",
              "title": "Đài Vọng Cảnh",
              "category": "viewpoint"
            }
          ]
        }
      }, {
        vi: {
          title: 'Thư viện hình ảnh',
          subtitle: 'Những khoảnh khắc đáng nhớ',
          content: `
            <p>Khám phá vẻ đẹp của khu du lịch Cáp treo Núi Sam qua những hình ảnh ấn tượng. Từ cảnh quan thiên nhiên tuyệt đẹp đến những công trình kiến trúc tâm linh độc đáo, mỗi bức ảnh là một câu chuyện về vùng đất này.</p>
          `,
          data: {
            description: 'Bộ sưu tập hình ảnh đặc sắc về khu du lịch Cáp treo Núi Sam'
          }
        },
        en: {
          title: 'Photo Gallery',
          subtitle: 'Memorable Moments',
          content: `
            <p>Explore the beauty of Sam Mountain Cable Car Tourist Area through impressive images. From beautiful natural landscapes to unique spiritual architectural works, each photo tells a story about this land.</p>
          `,
          data: {
            description: 'A collection of distinctive images of Sam Mountain Cable Car Tourist Area'
          }
        }
      });

      this.logger.log('Tourism about sections seeded successfully');
    } catch (error) {
      this.logger.error(`Error seeding tourism about sections: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  private async createSection(
    sectionData: Partial<AboutSection>,
    translations: {
      vi: {
        title: string;
        subtitle?: string;
        content?: string;
        data?: Record<string, any>;
      };
      en: {
        title: string;
        subtitle?: string;
        content?: string;
        data?: Record<string, any>;
      };
    }
  ): Promise<AboutSection> {
    const section = this.sectionRepository.create({
      ...sectionData,
      isActive: true
    });
    const savedSection = await this.sectionRepository.save(section);

    const translationsToSave = [
      {
        sectionId: savedSection.id,
        locale: 'vi',
        ...translations.vi
      },
      {
        sectionId: savedSection.id,
        locale: 'en',
        ...translations.en
      }
    ];

    await this.sectionTranslationRepository.save(translationsToSave);

    return savedSection;
  }
}
