import { Module } from '../lib/plugins.js';

// Basic bot owner commands: eval, restart, shutdown, setprefix
Module({
  command: 'owner',
  package: 'owner',
  description: 'Bot owner utilities (only owner)'.
})(async (message, match) => {
  try {
    // `isOwner` helper may be provided by serialize.js; fall back to check config
    const sender = message.sender;
    const isOwner = (message.isOwner === true) || (message.conn?.user?.id === sender);
    if (!isOwner) return message.reply('⚠️ Only the bot owner can use this command.');

    const args = (match || '').trim().split(/\s+/);
    const sub = args.shift() || '';

    if (sub === 'eval') {
      const code = args.join(' ');
      if (!code) return message.reply('Usage: .owner eval <js>');
      try {
        // eslint-disable-next-line no-eval
        const result = await eval(code);
        await message.reply('✅ Result:\n' + String(result));
      } catch (e) {
        await message.reply('❌ Error:\n' + String(e));
      }
      return;
    }

    if (sub === 'restart') {
      await message.reply('🔁 Restarting...');
      // attempt graceful shutdown if manager exists
      try {
        if (message.conn?.ev?.emit) message.conn.ev.emit('shutdown');
      } catch (e) {}
      // fallback: exit process
      process.exit(0);
    }

    if (sub === 'shutdown') {
      await message.reply('⛔ Shutting down...');
      process.exit(0);
    }

    if (sub === 'help' || sub === '') {
      return message.reply([
        'Owner commands:',
        '.owner eval <js> - evaluate JS',
        '.owner restart - restart bot',
        '.owner shutdown - stop bot',
      ].join('\n'));
    }

    await message.reply('Unknown subcommand. Use .owner help');
  } catch (err) {
    console.error('owner plugin error', err);
  }
});
import { Module } from '../lib/plugins.js';
import config from '../config.js';

Module({
  command: 'owner',
  package: 'owner',
  description: 'Bot owner utilities (only owner)',
  usage: '.owner <eval|restart|shutdown|help>',
})(async (message, match) => {
  try {
    const sender = message.sender || message.from || '';
    const short = sender.split('@')[0];

    const owners = (config && config.owner) || [];
    const isOwner = message.isOwner === true || owners.includes(short);
    if (!isOwner) return message.send('⚠️ Only the bot owner can use this command.');

    const args = (match || '').trim().split(/\s+/);
    const sub = args.shift() || '';

    if (sub === 'eval') {
      const code = args.join(' ');
      if (!code) return message.send('Usage: .owner eval <js>');
      try {
        // eslint-disable-next-line no-eval
        let result = await eval(code);
        if (typeof result !== 'string') result = require('util').inspect(result, { depth: 1 });
        await message.send('✅ Result:\n' + String(result));
      } catch (e) {
        await message.send('❌ Error:\n' + String(e));
      }
      return;
    }

    if (sub === 'restart') {
      await message.send('🔁 Restarting...');
      try {
        if (message.conn?.ev?.emit) message.conn.ev.emit('shutdown');
      } catch (e) {}
      process.exit(0);
    }

    if (sub === 'shutdown') {
      await message.send('⛔ Shutting down...');
      process.exit(0);
    }

    if (sub === 'help' || sub === '') {
      return message.send([
        'Owner commands:',
        '.owner eval <js> - evaluate JS',
        '.owner restart - restart bot',
        '.owner shutdown - stop bot',
      ].join('\n'));
    }

    await message.send('Unknown subcommand. Use .owner help');
  } catch (err) {
    console.error('owner plugin error', err);
  }
});
  package: "fun",
