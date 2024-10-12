import Comment from "../models/Comments.js";
import User from "../models/User.js";
import Posts from "../models/Posts.js";
import Jwt from "jsonwebtoken";
import mongoose from "mongoose";

//const { ObjectId } = require("mongoose").Types;
import { PubSub, withFilter } from "graphql-subscriptions";
import Friendship from "../models/friendship.js";

const pubSub = new PubSub();

const resolvers = {
  Query: {
    GetUserAll: async () => {
      try {
        return  await User.find()
      } catch (error) {
        console.warn("Error al traer la lista de usuarios", error.message);
      }
    },

    GetUser: async (_, {userId}) => {
      try {
        const users = await User.find()
        const userMe = users.filter((user) => user._id.equals(userId))
        return userMe
      } catch (error) {
        console.warn("Error al traer al usuario", error.message);
      }
    },

    GetPosts: async () => {
      try {
        const allPost = await Posts.find();

        allPost.sort((a, b) => b.createdAt - a.createdAt);
        // console.log('mis posts--->', allPost);
        return allPost;
      } catch (error) {
        console.log("Error al traer los post", error.message);
      }
    },

    GetComments: async (_, { postId }) => {
      try {
        const allComments = await Comment.find({ postId }).populate("author");
        return allComments;
      } catch (error) {
        console.log("Error al traer los comentarios", error.message);
      }
    },

    CountComment : async (_, {postId}) => {
      try {
        const quantityComment = await Comment.find({postId: postId})
        console.log('------Z', quantityComment.length);
        return  quantityComment.length
      } catch (error) {
        console.log("Error no hay comentarios en este post", error.message);
      }
   },

    PendingFriendRequests: async (_, args, context) => {
      if (!context.user.userId) {
        throw new AuthenticationError('Debes iniciar sesión para acceder a tus solicitudes de amistad.');
      }

      try {
        const pendingRequests = await Friendship.find({
          toUser: context.user.userId,
          status: 'pending',
        }).populate('fromUser');
        
        console.log("......", pendingRequests); 
        return pendingRequests;
      } catch (error) {
        console.error("Error al obtener las solicitudes pendientes:", error);
        throw new ApolloError("No se pudieron obtener las solicitudes pendientes.", "INTERNAL_SERVER_ERROR");
      }
    },
  },

  Mutation: {
    CreateUser: async (_, { input }) => {
      // console.log("data user-->>>", input);
      try {
        const user = new User({
          ...input,
        });
        await user.save();
        return user;
      } catch (error) {
        throw new ApolloError("Error al crear el usuario.:", error);
      }
    },

    Login: async (_, { email, password }) => {
      const user = await User.findOne({
        email: email,
        password: password,
      });

      if (!user) {
        throw new Error("Credenciales invalidas");
      }

      const token = Jwt.sign(
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        process.env.SECRET_KEY,
        { expiresIn: "2h" }
      );
      return token;
    },

    UpdateUser: async (_, args) => {
      const { id, name, email, password, avatar } = args;

      try {
        const changeUser = await User.findByIdAndUpdate(
          id,
          {
            $set: { name, email, password, avatar },
          },

          {
            new: true,
          }
        );

        if (!changeUser) {
          throw new Error("el suaurio no exite");
        }

        return changeUser;
      } catch (error) {
        throw new Error("Error al actualizar el usuario", error.message);
      }
    },

    CreatePost: async (_, { filter }) => {
      try {
        const newPost = new Posts({
          title: filter.title,
          content: filter.content,
          imageUrl: filter.imageUrl,
          author: {
            id: filter.author.id,
            name: filter.author.name,
            avatar: filter?.author?.avatar,
          },
        });

        await newPost.save();
        return true
      } catch (error) {
        throw new ApolloError("Error al crear el post:", error);
      }
    },

    DeletePost : async (_,{postId}, context) => {
      
      console.log('---->', context);
      try {
        const elpos = await Posts.findById(postId).exec()
        
        if ( context.user &&  elpos.author.id === context.user.userId) {
          await Posts.deleteOne({_id : postId})
          return true
        }else{
          return false
        }
      } catch (error) {
        throw new Error('error al eliminar el post')
      }

    },

    CreateComment: async (_, { input }) => {
      const post = await Posts.findById(input.postId);
      console.log("hhhhhhhhh", input);
      if (!post) {
        throw new Error("Nose encontro el post");
      }

      try {
        const newComment = new Comment({
          content: input.content,
          author: input.author,
          postId: input.postId,
        });

        await newComment.save();

        post.comments = post.comments.concat(newComment);

        console.log(post.comments);

        await post.save();
        // const payload = { NewComment: newComment };

        pubSub.publish("New_Comment", newComment);
        return newComment;
      } catch (error) {
        console.log("Errror al crear el comentario!", error.message);
        throw new Error("No se pudo crear el comentario.");
      }
    },

   

    SendFriendRequest: async (_, { toUserId }, context) => {
      if (!context.user.userId) {
        throw new AuthenticationError('Debes iniciar sesión para enviar solicitudes de amistad.');
      }
      const existingRequest = await Friendship.findOne({
        fromUser: context.user.userId,
        toUser: toUserId,
      });
      if (existingRequest) {
        throw new ApolloError('Ya has enviado una solicitud de amistad a este usuario.');
      }

      try {
        const newRequest = new Friendship({
          fromUser: context.user.userId,
          toUser: toUserId,
          status: "pending",
        });

        await newRequest.save();
        console.log(context.user.userId);
       return newRequest;
      } catch (error) {
        console.error("Error al obtener :", error);
        throw new Error("No se pudo enviar la solicitud de amistad.", error);
      }
    },
  },

  Subscription: {
    NewComment: {
      subscribe: withFilter(
        () => pubSub.asyncIterator("New_Comment"),
        (payload, variables) => {
          const postId = mongoose.Types.ObjectId(payload?.postId); // Convertir a ObjectId
          const requestedPostId = mongoose.Types.ObjectId(variables?.postId);
          return postId.equals(requestedPostId);
        }
      ),
      resolve: (payload) => {
        if (payload.content) {
          return payload; // Devolver la información del nuevo comentario
        }
      },
    },
  },
};

export default resolvers;
