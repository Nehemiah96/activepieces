import { Property, HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/framework";

export const stripeCommon = {
    baseUrl:  "https://api.stripe.com/v1",
    authentication: Property.SecretText({
        displayName:"API Key",
        required:true,
        description:"API key acquired from your Stripe dashboard"

    }),
    subscribeWebhook: async (eventName: string, webhookUrl: string, apiKey: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/webhook_endpoints`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: {
                enabled_events: [
                eventName
                ],
                url: webhookUrl
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
            },
            queryParams: {},
        };

        const { body: webhook } = await httpClient.sendRequest<{ id: string }>(request);
        return webhook;
    },
    unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${stripeCommon.baseUrl}/webhook_endpoints/${webhookId}`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: apiKey,
            },
        };
        return await httpClient.sendRequest(request);
    }
}
