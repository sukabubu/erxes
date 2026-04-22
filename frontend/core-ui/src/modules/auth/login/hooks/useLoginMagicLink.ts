import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LOGIN_WITH_GOOGLE,
  LOGIN_WITH_MAGIC_LINK,
} from '@/auth/login/grahpql/mutations/login';
import { useApolloClient, useMutation } from '@apollo/client';
import { toast } from 'erxes-ui';
import {
  magicLinkFormSchema,
  MagicLinkFormType,
} from '@/auth/login/definitions/magicLinkFormDefinitions';

export const useLoginMagicLink = () => {
  const [loginWithGoogle] = useMutation(LOGIN_WITH_GOOGLE);
  const [loginWithMagicLink] = useMutation(LOGIN_WITH_MAGIC_LINK);
  const { resetStore } = useApolloClient();

  const form = useForm<MagicLinkFormType>({
    resolver: zodResolver(magicLinkFormSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onChange',
  });

  const onMagicLinkSubmit: SubmitHandler<MagicLinkFormType> = ({
    email,
  }: MagicLinkFormType) => {
    loginWithMagicLink({
      variables: { email },
      onCompleted: () => {
        toast({
          title: '我们已向你的邮箱发送登录魔法链接。',
        });
        resetStore();
      },
      onError: ({ message }) => {
        const isInvalidLogin = message.includes('Invalid login');
        toast({
          title: isInvalidLogin ? '登录无效' : '发生错误',
          description: isInvalidLogin
            ? '你输入的邮箱地址或密码不正确。'
            : message,
          variant: 'destructive',
        });
      },
    });
  };

  const onGoogleLogin = () =>
    loginWithGoogle({
      onCompleted: (data) => {
        if (data?.loginWithGoogle) {
          try {
            const url = new URL(data.loginWithGoogle);
            if (url.protocol === 'https:' || url.protocol === 'http:') {
              window.location.href = data.loginWithGoogle;
            } else {
              throw new Error('Invalid URL protocol');
            }
          } catch (error) {
            toast({
              title: '发生错误',
              description: '收到无效的跳转地址',
              variant: 'destructive',
            });
          }
        }
      },
      onError: ({ message }) => {
        toast({
          title: '发生错误',
          description: message,
          variant: 'destructive',
        });
      },
    });

  return {
    form,
    onMagicLinkSubmit: form.handleSubmit(onMagicLinkSubmit),
    onGoogleLogin,
  };
};
