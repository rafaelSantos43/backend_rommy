const typeDefs = `
  directive @hasRole(roles: [String!]!) on FIELD_DEFINITION
  scalar Upload
  
  type User {
    id: ID
    name : String
    email: String
    password: String
    avatar: String
    website:String
    address: Address
    posts: [Post!]
    role: String
  }

  type Address {
    country: String
    city: String
  }

  type Post {
    id: ID
    title: String
    content: String
    author: User 
    comments: [Comment!]
    createdAt: String
    updatedAt: String

  }

  type File {
    filename : String
    mimetype : String
    encoding : String
  }

  type Comment {
    id: ID
    content: String
    author: User
    createdAt: String
    updatedAt: String
  }

  enum UserRole {
    admin
    usuario
  }

  input CreateUser {
    name: String!
    email: String!
    password: String!
    avatar: String
    role: UserRole
  }



  input User_filter {
    _id: String
  }

  type Query {
    GetUsers(filter: User_filter):[User]! @hasRole(roles:["admin"])
    GetUserAll(id:ID!): [User]! 
    GetPosts: [Post]!
    GetComments(postId:ID!): [Comment]
 
  }

  input Author {
    id:ID
    name: String
    avatar: String
  }

  input postCreate {
    title: String
    content: String
    author: Author
    createdAt: String
    updatedAt: String
  }

  input CommentCreate {
    content: String!
    postId: ID!
    author: ID!
    createdAt: String
    updatedAt: String
  }

  input UpdateMyUser {
    id: ID!
    name: String
    email: String
    password: String
    avartar: String
  }

  type Mutation {
    CreateUser(input:CreateUser!): User!
    UpdateUser(id:ID!, name:String, email:String, password: String, avatar: String ): User
    Login(email: String!, password: String!): String!
    CreatePost(input: postCreate!): Post
    CreateComment(input: CommentCreate!): Comment
   
  }

  type Subscription {
    NewComment: Comment 
  }

`;

export default typeDefs;
