import { initBotId } from 'botid/client/core';

// Vercel BotID — invisible bot protection on admin sign-up (credential/abuse
// defense). Real browsers pass silently; automated clients are challenged.
initBotId({
  protect: [
    { path: '/api/teacher/register', method: 'POST' },
  ],
});
