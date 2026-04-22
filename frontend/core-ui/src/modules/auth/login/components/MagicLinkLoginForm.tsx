import { useLoginMagicLink } from '@/auth/login/hooks/useLoginMagicLink';
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { Button, Form, Input, Label } from 'erxes-ui';
import { useTranslation } from 'react-i18next';

export const MagicLinkLoginForm = () => {
  const { form, onMagicLinkSubmit, onGoogleLogin } = useLoginMagicLink();
  const { t } = useTranslation('common');

  return (
    <Form {...form}>
      <form onSubmit={onMagicLinkSubmit} className="mx-auto grid gap-5">
        <div className="text-center text-sm text-accent-foreground">
          {t('auth.magic-link-description')}
        </div>
        <Form.Field
          name="email"
          control={form.control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label className="font-sans normal-case text-foreground text-sm font-medium leading-none">
                {t('auth.email')}
              </Form.Label>
              <Form.Message />
              <Form.Control>
                <Input
                  type="email"
                  placeholder={t('auth.enter-email')}
                  className="h-8"
                  {...field}
                />
              </Form.Control>
            </Form.Item>
          )}
        />

        <Button type="submit" className="h-8">
          {t('auth.continue')}
        </Button>
        <Label className="text-center">{t('auth.or')}</Label>
        <Button variant="secondary" onClick={onGoogleLogin} type="button">
          <IconBrandGoogleFilled />
          {t('auth.continue-with-google')}
        </Button>
      </form>
    </Form>
  );
};
