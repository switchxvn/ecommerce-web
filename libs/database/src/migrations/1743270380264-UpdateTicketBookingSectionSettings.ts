import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTicketBookingSectionSettings1743270380264 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Cập nhật cấu trúc settings cho ticket_booking section
        await queryRunner.query(`
            UPDATE theme_sections
            SET settings = jsonb_set(
                settings,
                '{form}',
                '{
                    "maxGuests": 10,
                    "minGuests": 1,
                    "buttonText": "Đặt vé ngay",
                    "buttonColor": "bg-primary-600 hover:bg-primary-700",
                    "guestsLabel": "Số khách",
                    "buttonTextColor": "text-white",
                    "datePickerLabel": "Ngày tham quan"
                }'::jsonb
            )
            WHERE type = 'ticket_booking';
        `);

        // Xóa tabs cũ và thêm cấu trúc mới cho product và variants
        await queryRunner.query(`
            UPDATE theme_sections
            SET settings = jsonb_set(
                jsonb_set(
                    settings,
                    '{product}',
                    '{
                        "id": null,
                        "title": "",
                        "description": "",
                        "thumbnail": "",
                        "price": 0
                    }'::jsonb
                ),
                '{variants}',
                '[]'::jsonb
            )
            WHERE type = 'ticket_booking';
        `);

        // Xóa tabs cũ
        await queryRunner.query(`
            UPDATE theme_sections
            SET settings = jsonb_set(
                settings,
                '{tabs}',
                'null'::jsonb
            )
            WHERE type = 'ticket_booking';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Khôi phục lại cấu trúc settings cũ
        await queryRunner.query(`
            UPDATE theme_sections
            SET settings = jsonb_set(
                settings,
                '{tabs}',
                '[
                    {
                        "id": "cable_car",
                        "label": "Vé cáp treo khứ hồi",
                        "price": 500000,
                        "description": "Vé cáp treo khứ hồi dành cho người lớn",
                        "image": "https://cdn.captreonuisam.com/tickets/cable_car.webp"
                    },
                    {
                        "id": "cable_car_buffet",
                        "label": "Vé cáp treo + Buffet",
                        "price": 800000,
                        "description": "Vé cáp treo khứ hồi kèm buffet trưa",
                        "image": "https://cdn.captreonuisam.com/tickets/buffet.jpg"
                    }
                ]'::jsonb
            )
            WHERE type = 'ticket_booking';
        `);

        // Xóa product và variants
        await queryRunner.query(`
            UPDATE theme_sections
            SET settings = jsonb_set(
                jsonb_set(
                    settings,
                    '{product}',
                    'null'::jsonb
                ),
                '{variants}',
                'null'::jsonb
            )
            WHERE type = 'ticket_booking';
        `);
    }
}
