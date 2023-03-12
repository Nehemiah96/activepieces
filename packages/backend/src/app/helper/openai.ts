import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";
import { Trigger } from "../../../../shared/src";
import { logger } from "./logger";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";


export async function guessTrigger(prompt: string): Promise<Trigger> {
    const configuration = new Configuration({
        apiKey: system.get(SystemProp.OPENAI_KEY),
    });
    const openai = new OpenAIApi(configuration);

    const piecesData = data.map(d => {
        return {
            role: "system" as ChatCompletionRequestMessageRoleEnum,
            content: JSON.stringify(d)
        }
    });

    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: "system",
                content: `
        Example Flow where there is webhook trigger and branching on condition then sends email if false
        {"trigger":{"type":"WEBHOOK","valid":true,"settings":{},"nextAction":{"type":"BRANCH","valid":true,"settings":{"conditions":[[{"operator":"NUMBER_IS_GREATER_THAN","firstValue":"\${trigger.body.age}","secondValue":"17"}]]},"displayName":"Branch Greater 17","onFailureAction":{"type":"PIECE","valid":false,"settings":{"input":{},"pieceName":"gmail","actionName":"send_email","pieceVersion":"0.0.0"},"displayName":"Gmail"}},"displayName":"Webhook Trigger"}}`
            },
            {
                role: "system",
                content: `
        Webhook Trigger
        {"trigger":{"type":"WEBHOOK","valid":true,"settings":{},"displayName":"Webhook Trigger", "nextAction": undefined}}`
            },
            {
                role: "system",
                content: `
        Scheduling trigger every 5 minutes
        {"trigger":{"type":"SCHEDULE","valid":true,"settings":{"cronExpression":"0/5 * * * *"},"displayName":"Every 5 Min"}}`
            },
            {
                role: "system",
                content: `
        When there is new message on slack It sends new message for discord, this the flow json
        {"trigger":{"type":"PIECE_TRIGGER","valid":true,"settings":{"pieceName":"slack","triggerName":"new_message","pieceVersion":"0.0.0", "input": {}},"nextAction":{"type":"PIECE","valid":true,"settings":{"pieceName":"discord","actionName":"send_message_webhook","pieceVersion":"0.0.0", "input":{}},"displayName":"Send Message"},"displayName":"Trigger"},"valid":true}`
            },
            ...piecesData,
            {
                role: "user",
                content: `Each Action Or Trigger has an optional attribute nextAction`
            },
            {
                role: "user",
                content: `The values for actionName and triggerName for each piece_name have been provided above don't use anything outside these values, and only relevant information should be included in the JSON code snippet. generate a JSON code snippet and don't fill input property for the flow that ${prompt}.`
            }],
        temperature: 0.3,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
    });
    const mixedData = response.data.choices[0].message!.content;

    logger.info(mixedData);
    const jsonStartIndex = mixedData.indexOf('{');
    const jsonEndIndex = mixedData.lastIndexOf('}');
    const jsonString = mixedData.substring(jsonStartIndex, jsonEndIndex + 1);
    return JSON.parse(jsonString).trigger;
}


const data = [
    {
        pieceName: 'airtable',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['new_record']
    },
    {
        pieceName: 'asana',
        pieceVersion: '0.0.0',
        actions: ['create_task'],
        triggers: []
    },
    {
        pieceName: 'bannerbear',
        pieceVersion: '0.0.0',
        actions: ['bannerbear_create_image'],
        triggers: []
    },
    {
        pieceName: 'binance',
        pieceVersion: '0.0.0',
        actions: ['fetch_crypto_pair_price'],
        triggers: []
    },
    {
        pieceName: 'blackbaud',
        pieceVersion: '0.0.0',
        actions: [
            'create_contact_batch',
            'search_contacts_after_date',
            'create_contact_if_not_exists',
            'update_contact'
        ],
        triggers: []
    },
    {
        pieceName: 'cal.com',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['BOOKING_CANCELLED', 'BOOKING_CREATED', 'BOOKING_RESCHEDULED']
    },
    {
        pieceName: 'calendly',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['invitee_created', 'invitee_canceled']
    },
    {
        pieceName: 'clickup',
        pieceVersion: '0.0.0',
        actions: [
            'create_task',
            'create_folderless_list',
            'get_list',
            'get_space',
            'get_spaces',
            'get_task_comments',
            'create_task_comments',
            'create_subtask'
        ],
        triggers: [
            'clickup_trigger_task_created',
            'clickup_trigger_task_updated',
            'clickup_trigger_task_deleted',
            'clickup_trigger_task_comment_posted',
            'clickup_trigger_task_comment_updated'
        ]
    },
    {
        pieceName: 'connections',
        pieceVersion: '0.0.1',
        actions: ['read_connection'],
        triggers: []
    },
    {
        pieceName: 'csv',
        pieceVersion: '0.0.0',
        actions: ['convert_csv_to_json', 'convert_json_to_csv'],
        triggers: []
    },
    {
        pieceName: 'discord',
        pieceVersion: '0.0.0',
        actions: ['send_message_webhook'],
        triggers: []
    },
    {
        pieceName: 'drip',
        pieceVersion: '0.0.0',
        actions: [
            'apply_tag_to_subscriber',
            'add_subscriber_to_campaign',
            'upsert_subscriber'
        ],
        triggers: ['new_subscriber', 'tag_applied_to_subscribers']
    },
    {
        pieceName: 'dropbox',
        pieceVersion: '0.0.0',
        actions: ['create_new_dropbox_folder', 'create_new_dropbox_text_file'],
        triggers: []
    },
    {
        pieceName: 'figma',
        pieceVersion: '0.0.0',
        actions: ['get_file', 'get_comments', 'post_comment'],
        triggers: ['new_comment']
    },
    {
        pieceName: 'freshsales',
        pieceVersion: '0.0.0',
        actions: ['freshsales_create_contact'],
        triggers: []
    },
    {
        pieceName: 'generatebanners',
        pieceVersion: '0.0.2',
        actions: ['render_template'],
        triggers: []
    },
    {
        pieceName: 'github',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['trigger_pull_request', 'trigger_star', 'trigger_issues']
    },
    {
        pieceName: 'gmail',
        pieceVersion: '0.0.0',
        actions: [
            'send_email',
            'gmail_get_mail',
            'gmail_search_mail',
            'gmail_get_thread'
        ],
        triggers: ['gmail_new_email_received']
    },
    {
        pieceName: 'google_calendar',
        pieceVersion: '0.0.0',
        actions: ['create_quick_event'],
        triggers: ['new_or_updated_event']
    },
    {
        pieceName: 'google_contacts',
        pieceVersion: '0.0.0',
        actions: ['add_contact'],
        triggers: ['new_or_updated_contact']
    },
    {
        pieceName: 'google_drive',
        pieceVersion: '0.0.0',
        actions: ['create_new_gdrive_folder', 'create_new_gdrive_file'],
        triggers: []
    },
    {
        pieceName: 'google_sheets',
        pieceVersion: '0.0.0',
        actions: ['insert_row'],
        triggers: ['new_row_added']
    },
    {
        pieceName: 'google_tasks',
        pieceVersion: '0.0.0',
        actions: ['add_task'],
        triggers: []
    },
    {
        pieceName: 'hackernews',
        pieceVersion: '0.0.0',
        actions: ['fetch_top_stories'],
        triggers: []
    },
    {
        pieceName: 'http',
        pieceVersion: '0.0.0',
        actions: ['send_request'],
        triggers: []
    },
    {
        pieceName: 'hubspot',
        pieceVersion: '0.0.0',
        actions: [
            'create_contact',
            'create_or_update_contact',
            'add_contact_to_list'
        ],
        triggers: []
    },
    {
        pieceName: 'mailchimp',
        pieceVersion: '0.0.0',
        actions: ['add_member_to_list'],
        triggers: ['subscribe']
    },
    {
        pieceName: 'openai',
        pieceVersion: '0.0.0',
        actions: ['ask_chatgpt'],
        triggers: []
    },
    {
        pieceName: 'pipedrive',
        pieceVersion: '0.0.0',
        actions: ['add_person'],
        triggers: [
            'new_person',
            'new_deal',
            'new_activity',
            'updated_person',
            'updated_deal'
        ]
    },
    {
        pieceName: 'posthog',
        pieceVersion: '0.0.0',
        actions: ['create_event', 'create_project'],
        triggers: []
    },
    {
        pieceName: 'rss',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['new-item']
    },
    {
        pieceName: 'sendgrid',
        pieceVersion: '0.0.0',
        actions: ['send_email'],
        triggers: []
    },
    {
        pieceName: 'slack',
        pieceVersion: '0.0.0',
        actions: ['send_direct_message', 'send_channel_message'],
        triggers: ['new_message', 'new_reaction_added']
    },
    {
        pieceName: 'storage',
        pieceVersion: '0.0.0',
        actions: ['get', 'put'],
        triggers: []
    },
    {
        pieceName: 'stripe',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: [
            'new_payment',
            'new_customer',
            'payment_failed',
            'new_subscription'
        ]
    },
    {
        pieceName: 'telegram_bot',
        pieceVersion: '0.0.0',
        actions: ['send_text_message'],
        triggers: []
    },
    {
        pieceName: 'todoist',
        pieceVersion: '0.0.0',
        actions: ['create_task'],
        triggers: ['task_completed']
    },
    {
        pieceName: 'twilio',
        pieceVersion: '0.0.0',
        actions: ['send_sms'],
        triggers: ['new_incoming_sms']
    },
    {
        pieceName: 'typeform',
        pieceVersion: '0.0.0',
        actions: [],
        triggers: ['new_submission']
    },
    {
        pieceName: 'wordpress',
        pieceVersion: '0.0.0',
        actions: ['create_post'],
        triggers: ['newPost']
    },
    {
        pieceName: 'youtube',
        pieceVersion: '0.0.1',
        actions: [],
        triggers: ['new-video']
    },
    {
        pieceName: 'zoom',
        pieceVersion: '0.0.0',
        actions: ['zoom_create_meeting', 'zoom_create_meeting_registrant'],
        triggers: []
    }
];
