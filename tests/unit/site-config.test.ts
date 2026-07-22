import { describe, expect, it } from 'vitest';

import { siteConfig } from '../../src/config/site';
import { themeConfig } from '../../src/config/theme';

describe('siteConfig', () => {
  it('defines the frozen site identity, locale, and display time zone', () => {
    expect(siteConfig.name).toBe('PonyLab');
    expect(siteConfig.language).toBe('zh-CN');
    expect(siteConfig.timeZone).toBe('Asia/Hong_Kong');
    expect(siteConfig.description.length).toBeGreaterThan(0);
  });

  it('keeps incomplete personal data in explicit typed placeholders', () => {
    expect(siteConfig.author.name).toContain('待填写');
    expect(siteConfig.author.bio).toContain('待填写');
    expect(siteConfig.socials.every((social) => social.isPlaceholder)).toBe(
      true,
    );
  });

  it('defines only the routes that are already frozen in the plan', () => {
    expect(siteConfig.navigation.map((item) => item.href)).toEqual([
      '/',
      '/blog/',
      '/projects/',
      '/about/',
    ]);
  });
});

describe('themeConfig', () => {
  it('supports only light, dark, and system modes in core V1', () => {
    expect(themeConfig.modes).toEqual(['light', 'dark', 'system']);
    expect(themeConfig.defaultMode).toBe('system');
  });

  it('provides a stable storage key and both browser theme colors', () => {
    expect(themeConfig.storageKey).toBe('ponylab-theme');
    expect(themeConfig.themeColor.light).toMatch(/^#[\dA-F]{6}$/i);
    expect(themeConfig.themeColor.dark).toMatch(/^#[\dA-F]{6}$/i);
    expect(themeConfig.themeColor.light).not.toBe(themeConfig.themeColor.dark);
  });
});
