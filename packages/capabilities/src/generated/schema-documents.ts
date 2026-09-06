/* eslint-disable */
/** Generated from JSON Schema files. */
export const schemaDocuments: Record<string, unknown> = {
  "common.json": {
    "$id": "https://quadrant.local/schemas/common.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$defs": {
      "id": {
        "type": "string",
        "minLength": 1
      },
      "requestId": {
        "type": "string",
        "minLength": 1
      },
      "confirmationToken": {
        "type": "string",
        "minLength": 1
      },
      "isoDate": {
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
      },
      "channel": {
        "type": "string",
        "enum": [
          "ui",
          "api",
          "mcp",
          "skill",
          "voice"
        ]
      },
      "workType": {
        "type": "string",
        "enum": [
          "brief",
          "short",
          "deep",
          "project"
        ]
      },
      "slotKind": {
        "type": "string",
        "enum": [
          "deep",
          "project"
        ]
      },
      "taskStatus": {
        "type": "string",
        "enum": [
          "inbox",
          "backlog",
          "snoozed",
          "completed",
          "archived"
        ]
      },
      "blockStatus": {
        "type": "string",
        "enum": [
          "planned",
          "executed",
          "cancelled",
          "missed"
        ]
      },
      "quadrant": {
        "type": "string",
        "enum": [
          "ui",
          "in",
          "un",
          "nn"
        ]
      },
      "unmatchedReason": {
        "type": "string",
        "enum": [
          "no_compatible_slot",
          "slot_full",
          "already_planned",
          "not_available"
        ]
      },
      "task": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "title",
          "status",
          "urgent",
          "important",
          "quadrant",
          "channel",
          "createdAt",
          "updatedAt",
          "consecutivePostponements",
          "suggestArchive",
          "hidden"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "notes": {
            "type": [
              "string",
              "null"
            ]
          },
          "originalText": {
            "type": "string"
          },
          "channel": {
            "$ref": "#/$defs/channel"
          },
          "projectId": {
            "type": [
              "string",
              "null"
            ]
          },
          "categoryId": {
            "type": [
              "string",
              "null"
            ]
          },
          "effectiveCategoryId": {
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "$ref": "#/$defs/taskStatus"
          },
          "urgent": {
            "type": "boolean"
          },
          "important": {
            "type": "boolean"
          },
          "quadrant": {
            "$ref": "#/$defs/quadrant"
          },
          "workType": {
            "anyOf": [
              {
                "$ref": "#/$defs/workType"
              },
              {
                "type": "null"
              }
            ]
          },
          "nominalMinutes": {
            "type": [
              "integer",
              "null"
            ]
          },
          "deadline": {
            "type": [
              "string",
              "null"
            ]
          },
          "availableOn": {
            "type": [
              "string",
              "null"
            ]
          },
          "createdAt": {
            "type": "string"
          },
          "updatedAt": {
            "type": "string"
          },
          "processedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "completedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "archivedAt": {
            "type": [
              "string",
              "null"
            ]
          },
          "consecutivePostponements": {
            "type": "integer"
          },
          "suggestArchive": {
            "type": "boolean"
          },
          "hidden": {
            "type": "boolean"
          }
        }
      },
      "category": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "archived"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "archived": {
            "type": "boolean"
          }
        }
      },
      "project": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "categoryId",
          "archived"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "categoryId": {
            "type": "string"
          },
          "archived": {
            "type": "boolean"
          }
        }
      },
      "slot": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekday",
          "order",
          "kind",
          "durationMinutes"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "weekday": {
            "type": "integer",
            "minimum": 1,
            "maximum": 7
          },
          "order": {
            "type": "integer"
          },
          "kind": {
            "$ref": "#/$defs/slotKind"
          },
          "durationMinutes": {
            "type": "integer"
          },
          "startTime": {
            "type": [
              "string",
              "null"
            ]
          }
        }
      },
      "slotDraft": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "weekday",
          "order",
          "kind",
          "durationMinutes"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "weekday": {
            "type": "integer",
            "minimum": 1,
            "maximum": 7
          },
          "order": {
            "type": "integer"
          },
          "kind": {
            "$ref": "#/$defs/slotKind"
          },
          "durationMinutes": {
            "type": "integer"
          },
          "startTime": {
            "type": [
              "string",
              "null"
            ]
          }
        }
      },
      "block": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekPlanId",
          "slotId",
          "taskId",
          "status",
          "nominalMinutes"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "weekPlanId": {
            "type": "string"
          },
          "slotId": {
            "type": "string"
          },
          "taskId": {
            "type": "string"
          },
          "status": {
            "$ref": "#/$defs/blockStatus"
          },
          "nominalMinutes": {
            "type": "integer"
          }
        }
      }
    }
  },
  "envelope.json": {
    "$id": "https://quadrant.local/schemas/envelope.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "status"
    ],
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "ok",
          "validation_error",
          "conflict",
          "needs_confirmation",
          "needs_clarification"
        ]
      },
      "request_id": {
        "type": [
          "string",
          "null"
        ]
      },
      "result": {
        "type": "object"
      },
      "error": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "message": {
            "type": "string"
          },
          "code": {
            "type": "string"
          },
          "details": true,
          "questions": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      },
      "confirmation_token": {
        "type": "string"
      },
      "summary": {
        "type": "string"
      },
      "expires_at": {
        "type": "string"
      }
    }
  },
  "inbox.capture_many.input.json": {
    "$id": "https://quadrant.local/schemas/inbox.capture_many.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "items"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "items": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "channel"
          ],
          "properties": {
            "title": {
              "type": "string"
            },
            "notes": {
              "type": "string"
            },
            "originalText": {
              "type": "string"
            },
            "channel": {
              "$ref": "common.json#/$defs/channel"
            },
            "alreadyProcessed": {
              "type": "boolean"
            },
            "urgent": {
              "type": "boolean"
            },
            "important": {
              "type": "boolean"
            },
            "workType": {
              "$ref": "common.json#/$defs/workType"
            },
            "nominalMinutes": {
              "type": "integer"
            },
            "projectId": {
              "type": "string"
            },
            "categoryId": {
              "type": "string"
            },
            "deadline": {
              "$ref": "common.json#/$defs/isoDate"
            }
          }
        }
      }
    }
  },
  "inbox.capture_many.output.json": {
    "$id": "https://quadrant.local/schemas/inbox.capture_many.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "tasks"
    ],
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/task"
        }
      }
    }
  },
  "inbox.list.input.json": {
    "$id": "https://quadrant.local/schemas/inbox.list.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "inbox.list.output.json": {
    "$id": "https://quadrant.local/schemas/inbox.list.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "tasks"
    ],
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/task"
        }
      }
    }
  },
  "backlog.list.input.json": {
    "$id": "https://quadrant.local/schemas/backlog.list.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "categoryId": {
        "type": "string"
      },
      "projectId": {
        "type": "string"
      }
    }
  },
  "backlog.list.output.json": {
    "$id": "https://quadrant.local/schemas/backlog.list.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "tasks"
    ],
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/task"
        }
      }
    }
  },
  "task.get.input.json": {
    "$id": "https://quadrant.local/schemas/task.get.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "taskId": {
        "type": "string"
      },
      "title": {
        "type": "string"
      }
    }
  },
  "task.get.output.json": {
    "$id": "https://quadrant.local/schemas/task.get.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "task.process.input.json": {
    "$id": "https://quadrant.local/schemas/task.process.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId",
      "urgent",
      "important",
      "workType"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      },
      "urgent": {
        "type": "boolean"
      },
      "important": {
        "type": "boolean"
      },
      "workType": {
        "$ref": "common.json#/$defs/workType"
      },
      "nominalMinutes": {
        "type": "integer"
      },
      "deadline": {
        "anyOf": [
          {
            "$ref": "common.json#/$defs/isoDate"
          },
          {
            "type": "null"
          }
        ]
      },
      "availableOn": {
        "$ref": "common.json#/$defs/isoDate"
      },
      "projectId": {
        "type": [
          "string",
          "null"
        ]
      },
      "categoryId": {
        "type": [
          "string",
          "null"
        ]
      },
      "notes": {
        "type": "string"
      }
    }
  },
  "task.process.output.json": {
    "$id": "https://quadrant.local/schemas/task.process.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "task.update.input.json": {
    "$id": "https://quadrant.local/schemas/task.update.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "notes": {
        "type": [
          "string",
          "null"
        ]
      },
      "urgent": {
        "type": "boolean"
      },
      "important": {
        "type": "boolean"
      },
      "workType": {
        "$ref": "common.json#/$defs/workType"
      },
      "nominalMinutes": {
        "type": [
          "integer",
          "null"
        ]
      },
      "deadline": {
        "type": [
          "string",
          "null"
        ]
      },
      "availableOn": {
        "type": [
          "string",
          "null"
        ]
      },
      "projectId": {
        "type": [
          "string",
          "null"
        ]
      },
      "categoryId": {
        "type": [
          "string",
          "null"
        ]
      }
    }
  },
  "task.update.output.json": {
    "$id": "https://quadrant.local/schemas/task.update.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "task.postpone.input.json": {
    "$id": "https://quadrant.local/schemas/task.postpone.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      },
      "resumeWeekStart": {
        "$ref": "common.json#/$defs/isoDate"
      },
      "weeksAhead": {
        "type": "integer",
        "minimum": 1
      }
    }
  },
  "task.postpone.output.json": {
    "$id": "https://quadrant.local/schemas/task.postpone.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task",
      "suggestArchive"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      },
      "suggestArchive": {
        "type": "boolean"
      }
    }
  },
  "task.complete.input.json": {
    "$id": "https://quadrant.local/schemas/task.complete.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      }
    }
  },
  "task.complete.output.json": {
    "$id": "https://quadrant.local/schemas/task.complete.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "task.archive.input.json": {
    "$id": "https://quadrant.local/schemas/task.archive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      }
    }
  },
  "task.archive.output.json": {
    "$id": "https://quadrant.local/schemas/task.archive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "task.unarchive.input.json": {
    "$id": "https://quadrant.local/schemas/task.unarchive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "taskId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      }
    }
  },
  "task.unarchive.output.json": {
    "$id": "https://quadrant.local/schemas/task.unarchive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "task"
    ],
    "properties": {
      "task": {
        "$ref": "common.json#/$defs/task"
      }
    }
  },
  "category.create.input.json": {
    "$id": "https://quadrant.local/schemas/category.create.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "name": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "category.create.output.json": {
    "$id": "https://quadrant.local/schemas/category.create.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "category"
    ],
    "properties": {
      "category": {
        "$ref": "common.json#/$defs/category"
      }
    }
  },
  "category.rename.input.json": {
    "$id": "https://quadrant.local/schemas/category.rename.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "categoryId",
      "name"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "categoryId": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "category.rename.output.json": {
    "$id": "https://quadrant.local/schemas/category.rename.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "category"
    ],
    "properties": {
      "category": {
        "$ref": "common.json#/$defs/category"
      }
    }
  },
  "category.archive.input.json": {
    "$id": "https://quadrant.local/schemas/category.archive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "categoryId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "category.archive.output.json": {
    "$id": "https://quadrant.local/schemas/category.archive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "category"
    ],
    "properties": {
      "category": {
        "$ref": "common.json#/$defs/category"
      }
    }
  },
  "category.unarchive.input.json": {
    "$id": "https://quadrant.local/schemas/category.unarchive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "categoryId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "category.unarchive.output.json": {
    "$id": "https://quadrant.local/schemas/category.unarchive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "category"
    ],
    "properties": {
      "category": {
        "$ref": "common.json#/$defs/category"
      }
    }
  },
  "category.list.input.json": {
    "$id": "https://quadrant.local/schemas/category.list.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "includeArchived": {
        "type": "boolean"
      }
    }
  },
  "category.list.output.json": {
    "$id": "https://quadrant.local/schemas/category.list.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "categories"
    ],
    "properties": {
      "categories": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/category"
        }
      }
    }
  },
  "project.create.input.json": {
    "$id": "https://quadrant.local/schemas/project.create.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "categoryId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "name": {
        "type": "string",
        "minLength": 1
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "project.create.output.json": {
    "$id": "https://quadrant.local/schemas/project.create.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "project"
    ],
    "properties": {
      "project": {
        "$ref": "common.json#/$defs/project"
      }
    }
  },
  "project.rename.input.json": {
    "$id": "https://quadrant.local/schemas/project.rename.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "projectId",
      "name"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "projectId": {
        "type": "string"
      },
      "name": {
        "type": "string",
        "minLength": 1
      }
    }
  },
  "project.rename.output.json": {
    "$id": "https://quadrant.local/schemas/project.rename.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "project"
    ],
    "properties": {
      "project": {
        "$ref": "common.json#/$defs/project"
      }
    }
  },
  "project.move.input.json": {
    "$id": "https://quadrant.local/schemas/project.move.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "projectId",
      "categoryId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "projectId": {
        "type": "string"
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "project.move.output.json": {
    "$id": "https://quadrant.local/schemas/project.move.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "project"
    ],
    "properties": {
      "project": {
        "$ref": "common.json#/$defs/project"
      }
    }
  },
  "project.archive.input.json": {
    "$id": "https://quadrant.local/schemas/project.archive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "projectId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "projectId": {
        "type": "string"
      }
    }
  },
  "project.archive.output.json": {
    "$id": "https://quadrant.local/schemas/project.archive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "project"
    ],
    "properties": {
      "project": {
        "$ref": "common.json#/$defs/project"
      }
    }
  },
  "project.unarchive.input.json": {
    "$id": "https://quadrant.local/schemas/project.unarchive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "projectId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "projectId": {
        "type": "string"
      }
    }
  },
  "project.unarchive.output.json": {
    "$id": "https://quadrant.local/schemas/project.unarchive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "project"
    ],
    "properties": {
      "project": {
        "$ref": "common.json#/$defs/project"
      }
    }
  },
  "project.list.input.json": {
    "$id": "https://quadrant.local/schemas/project.list.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "includeArchived": {
        "type": "boolean"
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "project.list.output.json": {
    "$id": "https://quadrant.local/schemas/project.list.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "projects"
    ],
    "properties": {
      "projects": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/project"
        }
      }
    }
  },
  "template.create.input.json": {
    "$id": "https://quadrant.local/schemas/template.create.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "slots"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "name": {
        "type": "string",
        "minLength": 1
      },
      "slots": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/slotDraft"
        }
      }
    }
  },
  "template.create.output.json": {
    "$id": "https://quadrant.local/schemas/template.create.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "template"
    ],
    "properties": {
      "template": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "isDefault",
          "archived",
          "slots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "isDefault": {
            "type": "boolean"
          },
          "archived": {
            "type": "boolean"
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slotDraft"
            }
          }
        }
      }
    }
  },
  "template.duplicate.input.json": {
    "$id": "https://quadrant.local/schemas/template.duplicate.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "templateId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "templateId": {
        "type": "string"
      },
      "name": {
        "type": "string"
      }
    }
  },
  "template.duplicate.output.json": {
    "$id": "https://quadrant.local/schemas/template.duplicate.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "template"
    ],
    "properties": {
      "template": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "isDefault",
          "archived",
          "slots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "isDefault": {
            "type": "boolean"
          },
          "archived": {
            "type": "boolean"
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slotDraft"
            }
          }
        }
      }
    }
  },
  "template.update.input.json": {
    "$id": "https://quadrant.local/schemas/template.update.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "templateId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "templateId": {
        "type": "string"
      },
      "name": {
        "type": "string"
      },
      "slots": {
        "type": "array",
        "items": {
          "$ref": "common.json#/$defs/slotDraft"
        }
      }
    }
  },
  "template.update.output.json": {
    "$id": "https://quadrant.local/schemas/template.update.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "template"
    ],
    "properties": {
      "template": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "isDefault",
          "archived",
          "slots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "isDefault": {
            "type": "boolean"
          },
          "archived": {
            "type": "boolean"
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slotDraft"
            }
          }
        }
      }
    }
  },
  "template.archive.input.json": {
    "$id": "https://quadrant.local/schemas/template.archive.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "templateId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "templateId": {
        "type": "string"
      }
    }
  },
  "template.archive.output.json": {
    "$id": "https://quadrant.local/schemas/template.archive.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "template"
    ],
    "properties": {
      "template": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "name",
          "isDefault",
          "archived",
          "slots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "isDefault": {
            "type": "boolean"
          },
          "archived": {
            "type": "boolean"
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slotDraft"
            }
          }
        }
      }
    }
  },
  "template.list.input.json": {
    "$id": "https://quadrant.local/schemas/template.list.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "includeArchived": {
        "type": "boolean"
      }
    }
  },
  "template.list.output.json": {
    "$id": "https://quadrant.local/schemas/template.list.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "templates"
    ],
    "properties": {
      "templates": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "id",
            "name",
            "isDefault",
            "archived",
            "slots"
          ],
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "isDefault": {
              "type": "boolean"
            },
            "archived": {
              "type": "boolean"
            },
            "slots": {
              "type": "array",
              "items": {
                "$ref": "common.json#/$defs/slotDraft"
              }
            }
          }
        }
      }
    }
  },
  "week.open.input.json": {
    "$id": "https://quadrant.local/schemas/week.open.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "templateId": {
        "type": "string"
      },
      "weekStart": {
        "$ref": "common.json#/$defs/isoDate"
      }
    }
  },
  "week.open.output.json": {
    "$id": "https://quadrant.local/schemas/week.open.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "week"
    ],
    "properties": {
      "week": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekStart",
          "status",
          "slots",
          "blocks"
        ],
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "weekStart": {
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "type": [
              "string",
              "null"
            ]
          },
          "templateId": {
            "type": [
              "string",
              "null"
            ]
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slot"
            }
          },
          "blocks": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/block"
            }
          },
          "resumedTaskIds": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "today": {
            "type": "string",
            "format": "date"
          },
          "timezone": {
            "type": "string"
          },
          "capacity": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "totalMinutes",
              "occupiedMinutes",
              "freeMinutes",
              "days"
            ],
            "properties": {
              "totalMinutes": {
                "type": "integer"
              },
              "occupiedMinutes": {
                "type": "integer"
              },
              "freeMinutes": {
                "type": "integer"
              },
              "days": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "weekday",
                    "totalMinutes",
                    "occupiedMinutes",
                    "freeMinutes"
                  ],
                  "properties": {
                    "weekday": {
                      "type": "integer"
                    },
                    "totalMinutes": {
                      "type": "integer"
                    },
                    "occupiedMinutes": {
                      "type": "integer"
                    },
                    "freeMinutes": {
                      "type": "integer"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "week.review.input.json": {
    "$id": "https://quadrant.local/schemas/week.review.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "templateId": {
        "type": "string"
      },
      "targetWeekStart": {
        "$ref": "common.json#/$defs/isoDate",
        "format": "date"
      }
    }
  },
  "week.review.output.json": {
    "$id": "https://quadrant.local/schemas/week.review.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "week"
    ],
    "properties": {
      "week": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekStart",
          "status",
          "slots",
          "blocks"
        ],
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "weekStart": {
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "type": [
              "string",
              "null"
            ]
          },
          "templateId": {
            "type": [
              "string",
              "null"
            ]
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slot"
            }
          },
          "blocks": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/block"
            }
          },
          "resumedTaskIds": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "today": {
            "type": "string",
            "format": "date"
          },
          "timezone": {
            "type": "string"
          },
          "capacity": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "totalMinutes",
              "occupiedMinutes",
              "freeMinutes",
              "days"
            ],
            "properties": {
              "totalMinutes": {
                "type": "integer"
              },
              "occupiedMinutes": {
                "type": "integer"
              },
              "freeMinutes": {
                "type": "integer"
              },
              "days": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "weekday",
                    "totalMinutes",
                    "occupiedMinutes",
                    "freeMinutes"
                  ],
                  "properties": {
                    "weekday": {
                      "type": "integer"
                    },
                    "totalMinutes": {
                      "type": "integer"
                    },
                    "occupiedMinutes": {
                      "type": "integer"
                    },
                    "freeMinutes": {
                      "type": "integer"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "week.current.input.json": {
    "$id": "https://quadrant.local/schemas/week.current.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "week.current.output.json": {
    "$id": "https://quadrant.local/schemas/week.current.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "week"
    ],
    "properties": {
      "week": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekStart",
          "status",
          "slots",
          "blocks"
        ],
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "weekStart": {
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "type": [
              "string",
              "null"
            ]
          },
          "templateId": {
            "type": [
              "string",
              "null"
            ]
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slot"
            }
          },
          "blocks": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/block"
            }
          },
          "resumedTaskIds": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "today": {
            "type": "string",
            "format": "date"
          },
          "timezone": {
            "type": "string"
          },
          "capacity": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "totalMinutes",
              "occupiedMinutes",
              "freeMinutes",
              "days"
            ],
            "properties": {
              "totalMinutes": {
                "type": "integer"
              },
              "occupiedMinutes": {
                "type": "integer"
              },
              "freeMinutes": {
                "type": "integer"
              },
              "days": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "weekday",
                    "totalMinutes",
                    "occupiedMinutes",
                    "freeMinutes"
                  ],
                  "properties": {
                    "weekday": {
                      "type": "integer"
                    },
                    "totalMinutes": {
                      "type": "integer"
                    },
                    "occupiedMinutes": {
                      "type": "integer"
                    },
                    "freeMinutes": {
                      "type": "integer"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "week.adjust_slots.input.json": {
    "$id": "https://quadrant.local/schemas/week.adjust_slots.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "operations"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "weekPlanId": {
        "type": "string"
      },
      "operations": {
        "type": "array",
        "minItems": 1,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "op"
          ],
          "properties": {
            "op": {
              "type": "string",
              "enum": [
                "add",
                "remove",
                "move",
                "change"
              ]
            },
            "slotId": {
              "type": "string"
            },
            "weekday": {
              "type": "integer",
              "minimum": 1,
              "maximum": 7
            },
            "order": {
              "type": "integer"
            },
            "kind": {
              "$ref": "common.json#/$defs/slotKind"
            },
            "durationMinutes": {
              "type": "integer"
            },
            "startTime": {
              "type": [
                "string",
                "null"
              ]
            }
          }
        }
      }
    }
  },
  "week.adjust_slots.output.json": {
    "$id": "https://quadrant.local/schemas/week.adjust_slots.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "week"
    ],
    "properties": {
      "week": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekStart",
          "status",
          "slots",
          "blocks"
        ],
        "properties": {
          "id": {
            "type": [
              "string",
              "null"
            ]
          },
          "weekStart": {
            "type": [
              "string",
              "null"
            ]
          },
          "status": {
            "type": [
              "string",
              "null"
            ]
          },
          "templateId": {
            "type": [
              "string",
              "null"
            ]
          },
          "slots": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/slot"
            }
          },
          "blocks": {
            "type": "array",
            "items": {
              "$ref": "common.json#/$defs/block"
            }
          },
          "resumedTaskIds": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "today": {
            "type": "string",
            "format": "date"
          },
          "timezone": {
            "type": "string"
          },
          "capacity": {
            "type": "object",
            "additionalProperties": false,
            "required": [
              "totalMinutes",
              "occupiedMinutes",
              "freeMinutes",
              "days"
            ],
            "properties": {
              "totalMinutes": {
                "type": "integer"
              },
              "occupiedMinutes": {
                "type": "integer"
              },
              "freeMinutes": {
                "type": "integer"
              },
              "days": {
                "type": "array",
                "items": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": [
                    "weekday",
                    "totalMinutes",
                    "occupiedMinutes",
                    "freeMinutes"
                  ],
                  "properties": {
                    "weekday": {
                      "type": "integer"
                    },
                    "totalMinutes": {
                      "type": "integer"
                    },
                    "occupiedMinutes": {
                      "type": "integer"
                    },
                    "freeMinutes": {
                      "type": "integer"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "plan.propose.input.json": {
    "$id": "https://quadrant.local/schemas/plan.propose.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "weekPlanId": {
        "type": "string"
      },
      "reservations": {
        "type": "array",
        "uniqueItems": true,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "taskId",
            "slotId"
          ],
          "properties": {
            "taskId": {
              "type": "string",
              "minLength": 1
            },
            "slotId": {
              "type": "string",
              "minLength": 1
            }
          }
        }
      }
    }
  },
  "plan.propose.output.json": {
    "$id": "https://quadrant.local/schemas/plan.propose.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "proposal"
    ],
    "properties": {
      "proposal": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekPlanId",
          "assignments",
          "unmatched",
          "emptySlots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "weekPlanId": {
            "type": "string"
          },
          "accepted": {
            "type": "boolean"
          },
          "reservations": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "slotId"
              ],
              "properties": {
                "taskId": {
                  "type": "string",
                  "minLength": 1
                },
                "slotId": {
                  "type": "string",
                  "minLength": 1
                }
              }
            }
          },
          "assignments": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "slotId",
                "nominalMinutes"
              ],
              "properties": {
                "taskId": {
                  "type": "string"
                },
                "slotId": {
                  "type": "string"
                },
                "nominalMinutes": {
                  "type": "integer"
                }
              }
            }
          },
          "unmatched": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "reason"
              ],
              "properties": {
                "taskId": {
                  "type": "string"
                },
                "reason": {
                  "$ref": "common.json#/$defs/unmatchedReason"
                }
              }
            }
          },
          "emptySlots": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "plan.accept.input.json": {
    "$id": "https://quadrant.local/schemas/plan.accept.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "proposalId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "proposalId": {
        "type": "string"
      }
    }
  },
  "plan.accept.output.json": {
    "$id": "https://quadrant.local/schemas/plan.accept.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "proposal"
    ],
    "properties": {
      "proposal": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "id",
          "weekPlanId",
          "assignments",
          "unmatched",
          "emptySlots"
        ],
        "properties": {
          "id": {
            "type": "string"
          },
          "weekPlanId": {
            "type": "string"
          },
          "accepted": {
            "type": "boolean"
          },
          "reservations": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "slotId"
              ],
              "properties": {
                "taskId": {
                  "type": "string",
                  "minLength": 1
                },
                "slotId": {
                  "type": "string",
                  "minLength": 1
                }
              }
            }
          },
          "assignments": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "slotId",
                "nominalMinutes"
              ],
              "properties": {
                "taskId": {
                  "type": "string"
                },
                "slotId": {
                  "type": "string"
                },
                "nominalMinutes": {
                  "type": "integer"
                }
              }
            }
          },
          "unmatched": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": [
                "taskId",
                "reason"
              ],
              "properties": {
                "taskId": {
                  "type": "string"
                },
                "reason": {
                  "$ref": "common.json#/$defs/unmatchedReason"
                }
              }
            }
          },
          "emptySlots": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        }
      }
    }
  },
  "block.schedule.input.json": {
    "$id": "https://quadrant.local/schemas/block.schedule.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "taskId": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "slotId": {
        "type": "string"
      },
      "date": {
        "$ref": "common.json#/$defs/isoDate"
      },
      "slotKind": {
        "$ref": "common.json#/$defs/slotKind"
      },
      "weekPlanId": {
        "type": "string"
      }
    }
  },
  "block.schedule.output.json": {
    "$id": "https://quadrant.local/schemas/block.schedule.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "block"
    ],
    "properties": {
      "block": {
        "$ref": "common.json#/$defs/block"
      }
    }
  },
  "block.execute.input.json": {
    "$id": "https://quadrant.local/schemas/block.execute.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "blockId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "blockId": {
        "type": "string"
      }
    }
  },
  "block.execute.output.json": {
    "$id": "https://quadrant.local/schemas/block.execute.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "block"
    ],
    "properties": {
      "block": {
        "$ref": "common.json#/$defs/block"
      }
    }
  },
  "block.cancel.input.json": {
    "$id": "https://quadrant.local/schemas/block.cancel.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "blockId"
    ],
    "properties": {
      "request_id": {
        "$ref": "common.json#/$defs/requestId"
      },
      "confirmation_token": {
        "$ref": "common.json#/$defs/confirmationToken"
      },
      "blockId": {
        "type": "string"
      }
    }
  },
  "block.cancel.output.json": {
    "$id": "https://quadrant.local/schemas/block.cancel.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "block"
    ],
    "properties": {
      "block": {
        "$ref": "common.json#/$defs/block"
      }
    }
  },
  "report.nominal_time.input.json": {
    "$id": "https://quadrant.local/schemas/report.nominal_time.input.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "from": {
        "$ref": "common.json#/$defs/isoDate"
      },
      "to": {
        "$ref": "common.json#/$defs/isoDate"
      },
      "taskId": {
        "type": "string"
      },
      "projectId": {
        "type": "string"
      },
      "categoryId": {
        "type": "string"
      }
    }
  },
  "report.nominal_time.output.json": {
    "$id": "https://quadrant.local/schemas/report.nominal_time.output.json",
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "additionalProperties": false,
    "required": [
      "totals",
      "groups"
    ],
    "properties": {
      "totals": {
        "type": "object",
        "additionalProperties": false,
        "required": [
          "planned",
          "executed",
          "cancelled",
          "missed",
          "executedMinutes"
        ],
        "properties": {
          "planned": {
            "type": "integer"
          },
          "executed": {
            "type": "integer"
          },
          "cancelled": {
            "type": "integer"
          },
          "missed": {
            "type": "integer"
          },
          "executedMinutes": {
            "type": "integer"
          }
        }
      },
      "groups": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "id",
            "name",
            "kind",
            "planned",
            "executed",
            "cancelled",
            "missed",
            "executedMinutes"
          ],
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "kind": {
              "type": "string",
              "enum": [
                "task",
                "project",
                "category"
              ]
            },
            "planned": {
              "type": "integer"
            },
            "executed": {
              "type": "integer"
            },
            "cancelled": {
              "type": "integer"
            },
            "missed": {
              "type": "integer"
            },
            "executedMinutes": {
              "type": "integer"
            }
          }
        }
      }
    }
  }
};
