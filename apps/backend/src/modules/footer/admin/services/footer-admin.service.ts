import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Footer } from '../../entities/footer.entity';
import { CreateFooterInput, UpdateFooterInput } from '@ew/shared';

@Injectable()
export class FooterAdminService {
  constructor(
    @InjectRepository(Footer)
    private readonly footerRepository: Repository<Footer>,
  ) {}

  async create(data: CreateFooterInput) {
    const footerData: Partial<Footer> = {
      name: data.name,
      componentName: data.componentName ?? 'Footer',
      addresses: data.addresses ?? [],
      mapUrl: data.mapUrl ?? null,
      fanpageUrl: data.fanpageUrl ?? null,
      companyInfo: data.companyInfo,
      quickLinks: data.quickLinks ?? [],
      backgroundLightColor: data.backgroundLightColor ?? '#ffc107',
      backgroundDarkColor: data.backgroundDarkColor ?? '#111827',
      copyrightStyle: data.copyrightStyle,
      socialIcons: data.socialIcons ?? [],
      logoUrl: data.logoUrl,
      logoAlt: data.logoAlt ?? 'Company Logo',
      branchInfo: data.branchInfo,
      isActive: data.isActive ?? false,
      settings: data.settings ?? {},
    };

    const footer = this.footerRepository.create(footerData);
    const savedFooter = await this.footerRepository.save(footer);

    if (savedFooter.isActive) {
      return this.setActive(savedFooter.id);
    }

    return savedFooter;
  }

  async update(id: number, data: UpdateFooterInput) {
    const updateData: Partial<Footer> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.componentName !== undefined) updateData.componentName = data.componentName;
    if (data.addresses !== undefined) updateData.addresses = data.addresses;
    if (data.mapUrl !== undefined) updateData.mapUrl = data.mapUrl;
    if (data.fanpageUrl !== undefined) updateData.fanpageUrl = data.fanpageUrl;
    if (data.companyInfo !== undefined) updateData.companyInfo = data.companyInfo;
    if (data.quickLinks !== undefined) updateData.quickLinks = data.quickLinks;
    if (data.backgroundLightColor !== undefined) updateData.backgroundLightColor = data.backgroundLightColor;
    if (data.backgroundDarkColor !== undefined) updateData.backgroundDarkColor = data.backgroundDarkColor;
    if (data.copyrightStyle !== undefined) updateData.copyrightStyle = data.copyrightStyle;
    if (data.socialIcons !== undefined) updateData.socialIcons = data.socialIcons;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.logoAlt !== undefined) updateData.logoAlt = data.logoAlt;
    if (data.branchInfo !== undefined) updateData.branchInfo = data.branchInfo;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await this.footerRepository.update(id, updateData);
    const updatedFooter = await this.footerRepository.findOne({ where: { id } });

    if (!updatedFooter) {
      return null;
    }

    if (data.isActive) {
      return this.setActive(id);
    }

    return updatedFooter;
  }

  async delete(id: number) {
    await this.footerRepository.delete(id);
  }

  async findAll() {
    return this.footerRepository.find();
  }

  async findOne(id: number) {
    return this.footerRepository.findOne({ where: { id } });
  }

  async setActive(id: number) {
    // Deactivate all other footers
    await this.footerRepository.update({}, { isActive: false });
    // Activate the selected footer
    await this.footerRepository.update(id, { isActive: true });
    return this.footerRepository.findOne({ where: { id } });
  }
} 
