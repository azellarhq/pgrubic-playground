// tests/utils.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notify, copyToClipboard, printViolations, printErrors } from '../src/utils';

describe('Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('notify', () => {
    it('creates notification div with message and type', () => {
      notify('Hello World', 'error');
      const notification = document.querySelector('.notification.error');
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe('Hello World');
    });

    it('defaults to success type if none provided', () => {
      notify('Success message');
      const notification = document.querySelector('.notification.success');
      expect(notification).not.toBeNull();
      expect(notification.textContent).toBe('Success message');
    });

    it('removes the notification after timeout', async () => {
      vi.useFakeTimers();
      notify('Temp message');
      expect(document.querySelector('.notification')).not.toBeNull();
      vi.runAllTimers();
      expect(document.querySelector('.notification')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('copyToClipboard', () => {
    it('copies text content of element to clipboard', async () => {
      const clipboardWriteText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
      const element = document.createElement('div');
      element.id = 'test-id';
      element.textContent = 'Copy me';
      document.body.appendChild(element);

      await copyToClipboard('test-id');

      expect(clipboardWriteText).toHaveBeenCalledWith('Copy me');
    });

    it('handles missing element gracefully', async () => {
      const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
      await copyToClipboard('non-existent-id');
      expect(clipboardSpy).not.toHaveBeenCalled();
    });

    it('logs error on copy failure', async () => {
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('fail'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const element = document.createElement('div');
      element.id = 'test-id';
      element.textContent = 'Copy me';
      document.body.appendChild(element);

      await copyToClipboard('test-id');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to copy:'), expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('printViolations', () => {
    it('renders HTML for violations', () => {
      const violations = [
        { description: 'Test violation', rule_code: 'R001', line_number: 1, column_offset: 2 }
      ];
      const html = printViolations(violations);
      expect(html).toContain('Test violation');
      expect(html).toContain('R001');
      expect(html).toContain('Ln 1, Col 2');
    });
  });

  describe('printErrors', () => {
    it('renders HTML for errors', () => {
      const errors = [
        { message: 'Syntax error', hint: 'Check your syntax' }
      ];
      const html = printErrors(errors);
      expect(html).toContain('Syntax error');
      expect(html).toContain('Check your syntax');
    });
  });
});
