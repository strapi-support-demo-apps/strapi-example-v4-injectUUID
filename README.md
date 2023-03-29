# Building a global UUID to apply to certain content-types

This example application shows how you could inject a custom UUID field on certain content-types and automatically generate a random UUID during the create process for both the content and admin APIs.

## Injecting the UUID field

For this part we need to do it in the [register](https://docs.strapi.io/dev-docs/configurations/functions#register) phase to ensure it's actually created in the database as well. You can see this on lines 13-22 of the [index.js](./src/index.js) file.

```js
strapi.contentTypes['api::test.test'].attributes['someUUID'] = {
  type: 'string',
}
```

## Generating the UUID

Once we have the field injected we can then use the [beforeCreate](https://docs.strapi.io/dev-docs/backend-customization/models#available-lifecycle-events) lifecycle hook to generate the UUID. You can see this on lines 48-56 of the [index.js](./src/index.js) file. This will programmatically add the model lifecycle without needed to hard code it for every content-type

```js
const { randomUUID } = require('crypto');

strapi.db.lifecycles.subscribe({
  models: ['api::test.test'],

  beforeCreate(event) {
    if (!event?.params?.data['someUUID']) {
      event.params.data['someUUID'] = randomUUID();
    }
  }
})
```

## Configuring the content-manager edit view to disable the editing of the uuid

Now that we have the field injected and the value automatically created we need to disable the editing of the field in the content-manager. These are saved into the core-store collection in the database. You can see this in action on lines 25-45 [index.js](./src/index.js) file.

```js
const view = await strapi.db.query('strapi::core-store').findOne({
  where: {
    key: `plugin_content_manager_configuration_content_types::api::test.test`,
  },
});

let value = JSON.parse(view.value);

if (value?.metadatas['someUUID']) {
  value.metadatas['someUUID'].edit.editable = false;
}

await strapi.db.query("strapi::core-store").update({
  where: { id: view.id },
  data: {
    value: JSON.stringify(value) || value.toString(),
  },
});
```
