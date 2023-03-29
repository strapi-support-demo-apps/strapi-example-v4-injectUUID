'use strict';

const { randomUUID } = require('crypto');

const contentTypes = [
  'api::test.test',
  'api::blah.blah'
]

const uuidFieldName = 'uuidSTS';

module.exports = {
  register(/*{ strapi }*/) {
    // Register the various content-types you want to add the uuidSTS attribute to

    // Loop through the content-types and add the uuidSTS attribute
    for (let i=0; i < contentTypes.length; i++) {
      strapi.contentTypes[contentTypes[i]].attributes[uuidFieldName] = {
        type: 'string',
      }
    }
  },

  async bootstrap({ strapi }) {
    // Search through the content-type views and change the uuidSTS attribute to be readonly
    for (let i=0; i < contentTypes.length; i++) {
    const view = await strapi.db.query('strapi::core-store').findOne({ where: {
      key: `plugin_content_manager_configuration_content_types::${contentTypes[i]}`
    }})

    let value = JSON.parse(view.value)

    // Set editable to false within the content manager view (could also just remove it from the view)
    if (value?.metadatas[uuidFieldName]) {
      value.metadatas[uuidFieldName].edit.editable = false
    }

    // Update the view configuration
    await strapi.db.query('strapi::core-store').update({
      where: { id: view.id},
      data: {
        value: JSON.stringify(value) || value.toString()
      }
    })
  }

    // Inject Model lifecycles for each content-type
    strapi.db.lifecycles.subscribe({
      models: contentTypes,

      beforeCreate(event) {
        if (!event?.params?.data[uuidFieldName]) {
          event.params.data[uuidFieldName] = randomUUID();
        }
      }
    })
  },
};
