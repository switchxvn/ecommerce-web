import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export interface Address {
  title?: string;
  subtitle?: string;
  location: string;
  phone?: {
    label: string;
    number: string;
    contact?: string;
  }[];
  email?: {
    label: string;
    address: string;
    contact?: string;
  }[];
}

export interface CompanyInfo {
  name: string;
  registration: string;
  tax_number?: string;
  business_license?: string;
  footer_line?: string;
  certifications?: {
    image: string;
    alt?: string;
    text?: string;
  }[];
}

export interface QuickLink {
  label: string;
  url: string;
  icon?: string;
}

export interface SocialIcon {
  name: string;
  icon: string;
  url: string;
}

export interface BranchContact {
  name?: string;
  position?: string;
  phone?: string;
  email?: string;
}

export interface BranchInfo {
  title: string;
  address: string;
  contacts: BranchContact[];
}

export interface CopyrightStyle {
  text: string;
  light: {
    backgroundColor: string;
    textColor: string;
  };
  dark: {
    backgroundColor: string;
    textColor: string;
  };
}

export interface FooterSettings {
  verticalImage?: {
    url: string;
    alt: string;
  };
  policy_link?: {
    title: string;
    links: {
      label: string;
      url: string;
    }[];
  };
}

@Entity('footers')
export class Footer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ name: 'component_name', default: 'Footer' })
    componentName: string;

    @Column({ type: 'jsonb', name: 'addresses' })
    addresses: Address[];

    @Column({ nullable: true, name: 'map_url' })
    mapUrl?: string;

    @Column({ nullable: true, name: 'fanpage_url' })
    fanpageUrl?: string;

    @Column({ type: 'jsonb', name: 'company_info' })
    companyInfo: CompanyInfo;

    @Column({ type: 'jsonb', name: 'quick_links' })
    quickLinks: QuickLink[];

    @Column({ name: 'background_light_color' })
    backgroundLightColor: string;

    @Column({ name: 'background_dark_color' })
    backgroundDarkColor: string;

    @Column({ type: 'jsonb', name: 'copyright_style' })
    copyrightStyle: CopyrightStyle;

    @Column({ type: 'jsonb', name: 'social_icons' })
    socialIcons: SocialIcon[];

    @Column({ name: 'logo_url' })
    logoUrl: string;

    @Column({ name: 'logo_alt' })
    logoAlt: string;

    @Column({ type: 'jsonb', name: 'branch_info', nullable: true })
    branchInfo?: BranchInfo[];

    @Column({ default: false, name: 'is_active' })
    isActive: boolean;

    @Column({ type: 'jsonb', name: 'settings', default: {} })
    settings: FooterSettings;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: string;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: string;
} 
