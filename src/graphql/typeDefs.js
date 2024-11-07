const typeDefs = `
  directive @hasRole(roles: [String!]!) on FIELD_DEFINITION

  
  type User {
    id: ID
    name : String
    email: String
    dateOfBirth: String
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
    imageUrl: String
    likeCount: Int,
    commentCount: Int
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
    author:  User
    postId: String
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
    dateOfBirth: String!
    password: String!
    avatar: String
    role: UserRole
  }



  input User_filter {
    _id: String
  }

  input postCreate {
    title: String
    content: String
    author: ID
    imageUrl: String
    createdAt: String
    updatedAt: String
  }
  
  input CommentCreate {
    postId: ID!
    content: String!
    author: ID
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

  type Like {
    id: ID!
    author: User! 
    postId: ID!
    createdAt: String
    updatedAt: String
  }

  type Friendship {
    id: ID!
    fromUser: User!
    toUser: User!
    status: String!
  }



    type Query {
    GetUser(userId: ID!):[User] @hasRole(roles:["admin"])
    GetUserAll: [User] 
    GetPosts: [Post]!
    GetComments(postId:ID!): [Comment]
    GetListLike(postId:ID!): [Like]
    PendingFriendRequests: [Friendship]!
  }

  type Mutation {
    CreateUser(input:CreateUser!): User!
    UpdateUser(id:ID!, name:String, email:String, password: String, avatar: String ): User
    Login(email: String!, password: String!): String!
    CreatePost(filter: postCreate!): Post
    DeletePost(postId:ID!): Boolean
    CreateComment(filter: CommentCreate!): Comment
    addLike(postId:ID!): Post
    removeLike(postId:ID!): Post
    SendFriendRequest(toUserId: ID!): Friendship!
  }

  type Subscription {
    NewComment(postId: ID!): Comment
  }

`;

export default typeDefs;
