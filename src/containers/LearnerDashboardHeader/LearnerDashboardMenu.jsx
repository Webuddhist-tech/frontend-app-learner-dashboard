import { getConfig } from '@edx/frontend-platform';

import urls from 'data/services/lms/urls';

import messages from './messages';

const getLearnerHeaderMenu = (
  formatMessage,
  courseSearchUrl,
  authenticatedUser,
  exploreCoursesClick,
) => ({
  mainMenu: [
    {
      type: 'item',
      href: '/learner-dashboard/',
      content: formatMessage(messages.course),
      isActive: true,
    },
    ...(getConfig().ENABLE_PROGRAMS ? [{
      type: 'item',
      href: `${urls.programsUrl()}`,
      content: formatMessage(messages.program),
    }] : []),
    ...(!getConfig().NON_BROWSABLE_COURSES ? [{
      type: 'item',
      href: `${urls.baseAppUrl(courseSearchUrl)}`,
      content: formatMessage(messages.discoverNew),
      onClick: (e) => {
        exploreCoursesClick(e);
      },
    }]
      : []),
    {
      type: 'item',
      href: `${urls.baseAppUrl('/wishlist')}`,
      content: formatMessage(messages.wishlist),
    },
  ],
  secondaryMenu: [
    ...(getConfig().SUPPORT_URL ? [{
      type: 'item',
      href: `${getConfig().SUPPORT_URL}`,
      content: formatMessage(messages.help),
    }] : []),
  ],
  userMenu: [
    {
      heading: '',
      items: [
        {
          type: 'item',
          href: `${getConfig().ACCOUNT_PROFILE_URL}/u/${authenticatedUser?.username}`,
          content: formatMessage(messages.profile),
          iconName: 'profile',
        },
        {
          type: 'item',
          href: `${getConfig().ACCOUNT_SETTINGS_URL}`,
          content: formatMessage(messages.account),
          iconName: 'account',
        },
        ...(getConfig().ORDER_HISTORY_URL ? [{
          type: 'item',
          href: getConfig().ORDER_HISTORY_URL,
          content: formatMessage(messages.orderHistory),
        }] : []),
      ],
    },
    {
      heading: '',
      items: [
        {
          type: 'item',
          href: `${getConfig().LOGOUT_URL}`,
          content: formatMessage(messages.signOut),
          iconName: 'signout',
        },
      ],
    },
  ],
}
);

export default getLearnerHeaderMenu;