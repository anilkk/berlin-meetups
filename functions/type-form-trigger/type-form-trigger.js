const querystring = require("querystring");

const createClient = require('contentful-management').createClient;
const { CF_MANAGEMENT_ACCESS_TOKEN, CONTENTFUL_SPACE_ID} = process.env;

exports.handler = async (event, context) => {
  var client = createClient({
    accessToken: CF_MANAGEMENT_ACCESS_TOKEN
  });

  let newEntryId = '';
  let currentEnvironment = null;

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // When the method is POST, the name will no longer be in the event’s
  // queryStringParameters – it’ll be in the event body encoded as a query string
  const params = querystring.parse(event.body);
  console.log("EVENT --->", event);
  const [meetupName, meetupUrl] = event.body.form_response.answers;
  console.log("EVENT body --->", event.body.form_response.answers[]);
  // const name = params.name || "World";
  
  console.log("BEFORE CREATE EVENT --->");
  console.log(meetupName.text, meetupUrl.url);

  await client.getSpace(CONTENTFUL_SPACE_ID).then((space) => {
    space.getEnvironment('master').then((environment) => {
        currentEnvironment = environment;
        environment.createEntry('meetup', {
            fields: {
                name: {
                    'en-US': meetupName.text
                },
                url: {
                    'en-US': meetupUrl.url
                },
            }
         }).then((entry) => {
             const {
                 sys : {
                    id: newlyAddEntryId
                 }
             } = entry;
            console.log('new meetup entry was successfully created', newlyAddEntryId)
            newEntryId = newlyAddEntryId;
            return entry;
        })
        .then((entry) => entry.publish())
        .then(() => currentEnvironment.getEntry('ZJFQdPevS9JVoV7GEO9TW')) // Entry id for Meetups
        .then((entry) => {
            const entries = entry.fields.listOfMeetups['en-US'];
            entries.push({"sys":{"type":"Link","linkType":"Entry","id":newEntryId}});
            console.log('entry fields', entry.fields)
            entry.fields.listOfMeetups['en-US'] = entries
            return entry.update()
        })
        .catch(error => {
            console.log('ERROR -->', error)
        })
    
    })
  });
  console.log("AFTER CREATE EVENT --->");
  
  return {
    statusCode: 200,
    body: `Hello, world`,
  };
};