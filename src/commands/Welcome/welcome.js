import { getColor } from '../../config/bot.js';
import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import { getWelcomeConfig, updateWelcomeConfig } from '../../utils/database.js';
import { formatWelcomeMessage, truncateForEmbedField } from '../../utils/welcome.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ErrorTypes, replyUserError } from '../../utils/errorHandler.js';

if (subcommand === 'setup') {
    const channel = guild.channels.cache.find(
        c => c.name === '💬・général' && c.type === ChannelType.GuildText
    );

    if (!channel) {
        return await replyUserError(interaction, {
            type: ErrorTypes.VALIDATION,
            message: 'Le salon **💬・général** est introuvable.'
        });
    }

    const message = 'Bienvenue {user} dans le serveur !';
    const image = null;
    const ping = false;
