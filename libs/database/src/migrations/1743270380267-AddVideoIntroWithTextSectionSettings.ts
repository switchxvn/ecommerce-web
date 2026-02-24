import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHeroBannerSection1743270380267 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const theme = await queryRunner.query(`
            SELECT id FROM themes WHERE is_active = true
        `);
        if (!theme || theme.length === 0) {
            throw new Error('No active theme found');
        }
        const themeId = theme[0].id;
        await queryRunner.query(`
            INSERT INTO theme_sections (
                theme_id,
                type,
                component_name,
                title,
                "order",
                page_type,
                settings,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                ${themeId},
                'hero_banner',
                'HeroBannerSection',
                'Hero Banner Section',
                1,
                'home_page',
                '{
                    "backgroundImage": "https://cdn.captreonuisam.com/backgrounds/cap-treo-nui-sam.png",
                    "overlay": {
                        "backgroundColor": "rgba(0, 0, 0, 0.4)",
                        "backgroundGradient": {
                            "from": "rgba(0, 0, 0, 0.7)",
                            "to": "rgba(0, 0, 0, 0.3)",
                            "direction": "to-t"
                        }
                    },
                    "height": "100vh",
                    "title": "Khám Phá & Trải Nghiệm Ngay!",
                    "titleStyle": {
                        "color": "#ffffff",
                        "fontSize": "4rem",
                        "fontWeight": "700",
                        "textShadow": "2px 2px 4px rgba(0,0,0,0.5)",
                        "marginBottom": "1rem"
                    },
                    "button": {
                        "text": "Đặt vé: 0869 519 678",
                        "link": "/booking",
                        "style": {
                            "backgroundColor": "#FFB800",
                            "color": "#000000",
                            "padding": "1rem 2rem",
                            "fontSize": "1.25rem",
                            "fontWeight": "600",
                            "borderRadius": "9999px",
                            "boxShadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                        }
                    }
                }',
                true,
                NOW(),
                NOW()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM theme_sections
            WHERE type = 'hero_banner'
            AND component_name = 'HeroBannerSection';
        `);
    }
}
