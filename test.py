import os
from azure.communication.email import EmailClient

# Create the EmailClient object that you use to send Email messages.
email_client = EmailClient.from_connection_string("endpoint=https://email-parent.communication.azure.com/;accesskey=hBpt4vHJOD0O8QsK2i/lGXcMylyQRUsyuIh9hEy1c0V8swtD4t2YnKjdGtLEhA37wC9QvBGczlYfyuD5ynA0Pw==")

message = {
	"content": {
		"subject": "This is the subject",
		"plainText": "This is the body",
		"html": "<html><h1>This is the body</h1></html>"
	},
	"recipients": {
		"to": [
			{
				"address": "max@benmiller.com",
				"displayName": "Max Miller"
			}
		]
	},
	"senderAddress": "DoNotReply@3559ff51-87bd-43b2-93fc-2e5668c92648.azurecomm.net"
}

poller = email_client.begin_send(message)
print("Result: ", poller.result())
