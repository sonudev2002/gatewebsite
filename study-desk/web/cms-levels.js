// src/components/cms/cmsConfig.js

const CMS_LEVELS = Object.freeze({
  topic: {
    label: "Topic",
    parent: "subject",
  },
  subtopic: {
    label: "Subtopic",
    parent: "topic",
  },
  microtopic: {
    label: "Microtopic",
    parent: "subtopic",
  },
});
