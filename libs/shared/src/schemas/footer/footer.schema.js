import { z } from 'zod';
const footerPhoneSchema = z.object({
    label: z.string(),
    number: z.string(),
    contact: z.string().optional(),
});
const footerEmailSchema = z.object({
    label: z.string(),
    address: z.string(),
    contact: z.string().optional(),
});
const footerAddressSchema = z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    location: z.string(),
    phone: z.array(footerPhoneSchema).optional().default([]),
    email: z.array(footerEmailSchema).optional().default([]),
});
const footerCertificationSchema = z.object({
    image: z.string(),
    alt: z.string().optional(),
    text: z.string().optional(),
});
const footerCompanyInfoSchema = z.object({
    name: z.string(),
    registration: z.string().optional(),
    tax_number: z.string().optional(),
    business_license: z.string().optional(),
    footer_line: z.string().optional(),
    certifications: z.array(footerCertificationSchema).optional().default([]),
});
const footerQuickLinkSchema = z.object({
    label: z.string(),
    url: z.string(),
    icon: z.string().optional(),
});
const footerSocialIconSchema = z.object({
    name: z.string(),
    icon: z.string(),
    url: z.string(),
});
const footerBranchContactSchema = z.object({
    name: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
});
const footerBranchInfoSchema = z.object({
    title: z.string(),
    address: z.string().optional().default(''),
    contacts: z.array(footerBranchContactSchema).optional().default([]),
});
const footerCopyrightPaletteSchema = z.object({
    backgroundColor: z.string(),
    textColor: z.string(),
});
const footerCopyrightStyleSchema = z.object({
    text: z.string().optional().default(''),
    light: footerCopyrightPaletteSchema,
    dark: footerCopyrightPaletteSchema,
});
const footerSettingsSchema = z.object({
    verticalImage: z.object({
        url: z.string(),
        alt: z.string().optional().default(''),
    }).optional(),
    policy_link: z.object({
        title: z.string(),
        links: z.array(z.object({
            label: z.string(),
            url: z.string(),
        })).optional().default([]),
    }).optional(),
}).optional();
export const createFooterSchema = z.object({
    name: z.string().min(1),
    componentName: z.string().optional().default('Footer'),
    addresses: z.array(footerAddressSchema).optional().default([]),
    mapUrl: z.string().optional().nullable(),
    fanpageUrl: z.string().optional().nullable(),
    companyInfo: footerCompanyInfoSchema,
    quickLinks: z.array(footerQuickLinkSchema).optional().default([]),
    backgroundLightColor: z.string().optional().default('#ffc107'),
    backgroundDarkColor: z.string().optional().default('#111827'),
    copyrightStyle: footerCopyrightStyleSchema,
    socialIcons: z.array(footerSocialIconSchema).optional().default([]),
    logoUrl: z.string(),
    logoAlt: z.string().optional().default('Company Logo'),
    branchInfo: z.array(footerBranchInfoSchema).optional(),
    settings: footerSettingsSchema.optional().default({}),
    isActive: z.boolean().optional().default(false),
});
export const updateFooterSchema = createFooterSchema.partial();
//# sourceMappingURL=footer.schema.js.map