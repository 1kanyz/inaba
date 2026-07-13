```js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { successEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { TitanBotError, ErrorTypes, handleInteractionError } from '../../utils/errorHandler.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user.')
        .addUserOption(option =>
            option
                .setName('target')
                .setDescription('User to mute')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    category: 'moderation',

    async execute(interaction, config, client) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);

        if (!deferSuccess) {
            logger.warn('Mute interaction defer failed', {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                commandName: 'mute',
            });
            return;
        }

        try {
            const targetUser = interaction.options.getUser('target');
            const member = interaction.options.getMember('target');

            if (!targetUser) {
                throw new TitanBotError(
                    'Missing target user',
                    ErrorTypes.USER_INPUT,
                    'You must specify a user to mute.'
                );
            }

            if (targetUser.id === interaction.user.id) {
                throw new TitanBotError(
                    'Cannot mute self',
                    ErrorTypes.VALIDATION,
                    'You cannot mute yourself.'
                );
            }

            if (targetUser.id === client.user.id) {
                throw new TitanBotError(
                    'Cannot mute bot',
                    ErrorTypes.VALIDATION,
                    'You cannot mute the bot.'
                );
            }

            if (!member) {
                throw new TitanBotError(
                    'Target not found',
                    ErrorTypes.USER_INPUT,
                    'The target user is not currently in this server.'
                );
            }

            const mutedRole = interaction.guild.roles.cache.find(
                role => role.name === 'Muted'
            );

            if (!mutedRole) {
                throw new TitanBotError(
                    'Muted role not found',
                    ErrorTypes.CONFIGURATION,
                    'The "Muted" role does not exist on this server.'
                );
            }

            if (member.roles.cache.has(mutedRole.id)) {
                throw new TitanBotError(
                    'Already muted',
                    ErrorTypes.VALIDATION,
                    'This user is already muted.'
                );
            }

            if (
                member.roles.highest.position >=
                    interaction.member.roles.highest.position &&
                interaction.guild.ownerId !== interaction.user.id
            ) {
                throw new TitanBotError(
                    'Role hierarchy',
                    ErrorTypes.PERMISSION,
                    'You cannot mute a member with an equal or higher role.'
                );
            }

            const botMember = interaction.guild.members.me;

            if (
                member.roles.highest.position >=
                botMember.roles.highest.position
            ) {
                throw new TitanBotError(
                    'Bot hierarchy',
                    ErrorTypes.PERMISSION,
                    'My role must be higher than the target member role.'
                );
            }

            await member.roles.add(mutedRole);

            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    successEmbed(
                        `🔇 **Muted** ${targetUser.tag}.`,
                        `The user has been successfully muted.`
                    ),
                ],
            });
        } catch (error) {
            logger.error('Mute command error:', error);
            await handleInteractionError(interaction, error, {
                subtype: 'mute_failed',
            });
        }
    },
};
```

