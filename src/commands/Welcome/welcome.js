import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { getColor } from '../../config/bot.js';
import { updateWelcomeConfig } from '../../utils/database.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { ErrorTypes, replyUserError } from '../../utils/errorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure automatiquement le système de bienvenue')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Configurer le système de bienvenue')
        ),

    async execute(interaction) {
        await InteractionHelper.safeDefer(interaction);

        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
            return replyUserError(interaction, {
                type: ErrorTypes.PERMISSION,
                message: 'Vous devez avoir la permission **Gérer le serveur**.'
            });
        }

        const guild = interaction.guild;

        const channel = guild.channels.cache.find(
            c =>
                c.type === ChannelType.GuildText &&
                c.name === '💬・général'
        );

        if (!channel) {
            return replyUserError(interaction, {
                type: ErrorTypes.VALIDATION,
                message: 'Impossible de trouver le salon **💬・général**.'
            });
        }

        try {
            await updateWelcomeConfig(interaction.client, guild.id, {
                enabled: true,
                channelId: channel.id,
                welcomeMessage: 'Bienvenue {user} dans le serveur !',
                welcomeImage: null,
                welcomePing: false
            });

            const embed = new EmbedBuilder()
                .setColor(getColor('success'))
                .setTitle('✅ Système de bienvenue configuré')
                .setDescription(`Les messages seront envoyés dans ${channel}.`)
                .addFields(
                    {
                        name: 'Message',
                        value: 'Bienvenue {user} dans le serveur !'
                    },
                    {
                        name: 'Ping',
                        value: 'Non'
                    }
                );

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [embed]
            });

        } catch (err) {
            logger.error(err);

            return replyUserError(interaction, {
                type: ErrorTypes.UNKNOWN,
                message: 'Une erreur est survenue lors de la configuration.'
            });
        }
    }
};
