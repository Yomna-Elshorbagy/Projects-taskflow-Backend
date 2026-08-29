export default {
  "openapi": "3.0.0",
  "info": {
    "title": "TaskFlow Backend API",
    "description": "API documentation for the TaskFlow project management application. Offers user authentication, project creation, member invitation, task management, and task status change auditing.",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": process.env.API_BASE_URL,
      "description": "Live Production Server"
    },
    {
      "url": "http://localhost:3000",
      "description": "Local Development Server"
    }
  ],
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "apiKey",
        "name": "authentication",
        "in": "header",
        "description": "JWT Authorization header using bearer token. Example: 'bearer <token>'"
      }
    },
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "username": {
            "type": "string"
          },
          "email": {
            "type": "string"
          }
        }
      },
      "Project": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "creator": {
            "type": "string"
          },
          "members": {
            "type": "array",
            "items": {
              "type": "string"
            }
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Task": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "To Do",
              "In Progress",
              "Done"
            ]
          },
          "priority": {
            "type": "string",
            "enum": [
              "Low",
              "Medium",
              "High"
            ]
          },
          "dueDate": {
            "type": "string",
            "format": "date-time"
          },
          "project": {
            "type": "string"
          },
          "assignee": {
            "type": "string"
          },
          "creator": {
            "type": "string"
          },
          "statusHistory": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "status": {
                  "type": "string"
                },
                "changedAt": {
                  "type": "string",
                  "format": "date-time"
                },
                "changedBy": {
                  "type": "string"
                }
              }
            }
          }
        }
      },
      "Message": {
        "type": "object",
        "properties": {
          "_id": {
            "type": "string"
          },
          "task": {
            "type": "string"
          },
          "project": {
            "type": "string"
          },
          "sender": {
            "type": "object",
            "properties": {
              "_id": {
                "type": "string"
              },
              "userName": {
                "type": "string"
              },
              "email": {
                "type": "string"
              },
              "role": {
                "type": "string"
              },
              "image": {
                "type": "object"
              }
            }
          },
          "content": {
            "type": "string"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    }
  },
  "paths": {
    "/auth/signup": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Register a new user",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "userName",
                  "email",
                  "password",
                  "Cpassword",
                  "gender",
                  "mobileNumber"
                ],
                "properties": {
                  "userName": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string"
                  },
                  "Cpassword": {
                    "type": "string"
                  },
                  "gender": {
                    "type": "string",
                    "enum": [
                      "male",
                      "female"
                    ]
                  },
                  "mobileNumber": {
                    "type": "string"
                  }
                },
                "example": {
                  "userName": "testuser",
                  "email": "test@test.com",
                  "password": "Password123",
                  "Cpassword": "Password123",
                  "gender": "male",
                  "mobileNumber": "01012345678"
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "User created successfully",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "400": {
            "description": "Validation error"
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Log in an existing user",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "password"
                ],
                "properties": {
                  "email": {
                    "type": "string"
                  },
                  "mobileNumber": {
                    "type": "string"
                  },
                  "password": {
                    "type": "string"
                  }
                },
                "example": {
                  "email": "test@test.com",
                  "password": "Password123"
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login successful",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          },
          "401": {
            "description": "Invalid credentials",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object"
                }
              }
            }
          }
        }
      }
    },
    "/auth/logout": {
      "post": {
        "tags": [
          "Authentication"
        ],
        "summary": "Log out the current user",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Logged out successfully"
          },
          "401": {
            "description": "Unauthorized"
          }
        }
      }
    },
    "/auth/users": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Fetch list of all users",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "List of users",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/User"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/profile": {
      "get": {
        "tags": [
          "Authentication"
        ],
        "summary": "Fetch the authenticated user's profile",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "User profile details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          }
        }
      },
      "put": {
        "tags": [
          "Authentication"
        ],
        "summary": "Update the authenticated user's profile",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "username": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Profile updated successfully"
          }
        }
      }
    },
    "/projects": {
      "post": {
        "tags": [
          "Projects"
        ],
        "summary": "Create a new project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "name",
                  "description"
                ],
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Project created",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Project"
                }
              }
            }
          }
        }
      },
      "get": {
        "tags": [
          "Projects"
        ],
        "summary": "Get all projects for the authenticated user",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer"
            },
            "description": "Page number for pagination"
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            },
            "description": "Number of items per page"
          },
          {
            "name": "search",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Search keyword for project name or description"
          },
          {
            "name": "sort",
            "in": "query",
            "schema": {
              "type": "string"
            },
            "description": "Sorting options (e.g. 'name,-createdAt')"
          }
        ],
        "responses": {
          "200": {
            "description": "List of projects"
          }
        }
      }
    },
    "/projects/{projectId}": {
      "get": {
        "tags": [
          "Projects"
        ],
        "summary": "Get project by ID",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Project details",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Project"
                }
              }
            }
          },
          "404": {
            "description": "Project not found"
          }
        }
      },
      "put": {
        "tags": [
          "Projects"
        ],
        "summary": "Update project details",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Project updated successfully"
          },
          "403": {
            "description": "Only the project creator or an Admin can update projects"
          },
          "404": {
            "description": "Project not found"
          }
        }
      },
      "delete": {
        "tags": [
          "Projects"
        ],
        "summary": "Delete a project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Project deleted successfully"
          },
          "403": {
            "description": "Only an Admin can delete projects"
          },
          "404": {
            "description": "Project not found"
          }
        }
      }
    },
    "/projects/{projectId}/members": {
      "post": {
        "tags": [
          "Projects"
        ],
        "summary": "Add a member to a project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "email"
                ],
                "properties": {
                  "email": {
                    "type": "string"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Member added successfully"
          },
          "403": {
            "description": "Only an Admin can add members"
          }
        }
      }
    },
    "/projects/{projectId}/members/{userId}": {
      "delete": {
        "tags": [
          "Projects"
        ],
        "summary": "Remove a member from a project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Member removed successfully"
          },
          "403": {
            "description": "Only an Admin can remove members"
          },
          "404": {
            "description": "Project or member not found"
          }
        }
      }
    },
    "/projects/{projectId}/tasks": {
      "post": {
        "tags": [
          "Tasks"
        ],
        "summary": "Create a new task in a project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": [
                  "title",
                  "description",
                  "dueDate",
                  "assignee"
                ],
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "dueDate": {
                    "type": "string",
                    "format": "date"
                  },
                  "assignee": {
                    "type": "string",
                    "description": "User ID of assignee"
                  },
                  "priority": {
                    "type": "string",
                    "enum": [
                      "Low",
                      "Medium",
                      "High"
                    ],
                    "default": "Medium"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Task created successfully"
          }
        }
      },
      "get": {
        "tags": [
          "Tasks"
        ],
        "summary": "Get all tasks in a project",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "status",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "To Do",
                "In Progress",
                "Done"
              ]
            }
          },
          {
            "name": "priority",
            "in": "query",
            "schema": {
              "type": "string",
              "enum": [
                "Low",
                "Medium",
                "High"
              ]
            }
          },
          {
            "name": "page",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "schema": {
              "type": "integer"
            }
          },
          {
            "name": "search",
            "in": "query",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "List of tasks"
          }
        }
      }
    },
    "/projects/{projectId}/tasks/{taskId}": {
      "get": {
        "tags": [
          "Tasks"
        ],
        "summary": "Get details of a task",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Task details"
          }
        }
      },
      "put": {
        "tags": [
          "Tasks"
        ],
        "summary": "Update task (updates will append status changes to audit log)",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "string"
                  },
                  "description": {
                    "type": "string"
                  },
                  "status": {
                    "type": "string",
                    "enum": [
                      "To Do",
                      "In Progress",
                      "Done"
                    ]
                  },
                  "priority": {
                    "type": "string",
                    "enum": [
                      "Low",
                      "Medium",
                      "High"
                    ]
                  },
                  "assignee": {
                    "type": "string"
                  },
                  "dueDate": {
                    "type": "string",
                    "format": "date"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Task updated successfully"
          }
        }
      },
      "delete": {
        "tags": [
          "Tasks"
        ],
        "summary": "Delete a task",
        "security": [
          {
            "bearerAuth": []
          }
        ],
        "parameters": [
          {
            "name": "projectId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "taskId",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Task deleted successfully"
          }
        }
      }
    },
    "/socket": {
      "get": {
        "tags": [
          "WebSockets"
        ],
        "summary": "WebSocket Connection Protocol (Socket.io)",
        "description": "Establish a WebSocket connection using Socket.io client for real-time task group chat. Requires authorization token in handshake auth object.",
        "parameters": [
          {
            "name": "token",
            "in": "query",
            "required": true,
            "description": "JWT Authorization token passed in handshake `auth.token` parameter",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "101": {
            "description": "Successfully upgraded to WebSocket protocol. Supports events: `join_task`, `send_message`, `typing`, `stop_typing`"
          },
          "401": {
            "description": "Unauthorized connection"
          }
        }
      }
    }
  }
};