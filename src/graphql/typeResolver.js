import { ApolloError } from "apollo-server-express";
import mongoose from "mongoose";
import Jwt from "jsonwebtoken";

import Comment from "../models/Comments.js";
import User from "../models/User.js";
import Posts from "../models/Posts.js";
import LikeList from "../models/LikeList.js";

//const { ObjectId } = require("mongoose").Types;
import { PubSub, withFilter } from "graphql-subscriptions";
import Friendship from "../models/friendship.js";

const pubSub = new PubSub();

const resolvers = {
  Query: {
    GetUserAll: async () => {
      try {
        return await User.find();
      } catch (error) {
        console.warn("Error al traer la lista de usuarios", error.message);
      }
    },

    GetUser: async (_, { userId }) => {
      try {
        const users = await User.find();
        const userMe = users.filter((user) => user._id.equals(userId));
        return userMe;
      } catch (error) {
        console.warn("Error al traer al usuario", error.message);
      }
    },

    GetPosts: async () => {
      try {
        const allPost = await Posts.find()
          .populate("author")
          .sort({ createdAt: -1 });
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

    GetListLike: async (_, { postId }, { user }) => {
      const userInBd = await User.findById(user.id);
      if (!userInBd) throw new Error("!No se encuentra el usuario¡");

      const post = await Posts.findById(postId);
      if (!post)
        throw new Error("!No se encuentra el Post asociado para darle like.¡");

      try {
        const getListLike = await LikeList.find({ postId });
        console.log(getListLike, "y esto");

        return getListLike;
      } catch (error) {
        console.error("Error al obtener la lista de likes:", error);
        throw new ApolloError(
          "No se pudieron obtener la lista de likes.",
          "INTERNAL_SERVER_ERROR"
        );
      }
    },

    PendingFriendRequests: async (_, args, context) => {
      if (!context.user.userId) {
        throw new AuthenticationError(
          "Debes iniciar sesión para acceder a tus solicitudes de amistad."
        );
      }

      try {
        const pendingRequests = await Friendship.find({
          toUser: context.user.userId,
          status: "pending",
        }).populate("fromUser");

        console.log("......", pendingRequests);
        return pendingRequests;
      } catch (error) {
        console.error("Error al obtener las solicitudes pendientes:", error);
        throw new ApolloError(
          "No se pudieron obtener las solicitudes pendientes.",
          "INTERNAL_SERVER_ERROR"
        );
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

    CreatePost: async (_, { filter }, { user }) => {
      if (!mongoose.Types.ObjectId.isValid(user.id)) {
        throw new ApolloError("ID de autor no es válido.");
      }

      try {
        const newPost = new Posts({
          title: filter.title,
          content: filter.content,
          imageUrl: filter.imageUrl || "",
          author: user.id,
        });

        await newPost.save();
        const populatedPost = await Posts.findById(newPost._id).populate(
          "author",
          "name",
        );

        return populatedPost;
      } catch (error) {
        console.error("Error detalle:", error);
        throw new ApolloError("Error al crear el post:", error);
      }
    },

    DeletePost: async (_, { postId }, { user }) => {
      console.log("---->", user);
      try {
        const existingPost = await Posts.findById(postId).exec();

        if (user && existingPost.author.id === user.id) {
          await Posts.deleteOne({ _id: postId });
          return true;
        } else {
          return false;
        }
      } catch (error) {
        throw new Error("error al eliminar el post");
      }
    },

    CreateComment: async (_, { filter }, { user }) => {
      const post = await Posts.findById(filter.postId);

      if (!post) {
        throw new Error("Nose encontro el post");
      }

      try {
        const newComment = new Comment({
          content: filter.content,
          author: user.id,
          postId: filter.postId,
        });
        await newComment.save();
        await newComment.populate("author");
        post.commentCount += 1;
        post.save();
        // pubSub.publish("New_Comment", newComment)
        return newComment;
      } catch (error) {
        console.log("Errror al crear el comentario!", error.message);
        throw new Error("No se pudo crear el comentario.");
      }
    },

    addLike: async (_, { postId }, { user }) => {
      const userInBd = await User.findById(user.id);
      if (!userInBd) throw new Error("Usuario no authenticado");

      const post = await Posts.findById(postId);
      if (!post) throw new Error("Post no encontrado");

      try {
        const existingLike = await LikeList.findOne({
          "author._id": userInBd._id,
          postId,
        });

        if (existingLike) {
          await LikeList.deleteOne({ _id: existingLike._id });
          post.likeCount = await LikeList.countDocuments({ postId })
          await post.save()

          // const postWithLikes = {
          //   __typename: "Post",
          //   id: post._id.toString(),
          //   likeCount: post.likeCount,
          //   postId: post._id.toString(),
          //   author: {
          //     __typename: "User",
          //     id: userInBd._id.toString(),
          //     name: userInBd.name,
          //     avatar: userInBd.avatar || "",
          //   },
          // }

          // return postWithLikes
        } else {
          const newLike = new LikeList({
            postId,
            author: {
              _id: userInBd._id,
              name: userInBd.name,
              avatar: userInBd.avatar || "",
            },
          });
          await newLike.save();
          post.likeCount = await LikeList.countDocuments({ postId })
          console.log(post.likeCount,'pero si aqui esta bien')
          await post.save()
        }


        const postWithLikes = {
          __typename: "Post",
          id: post._id.toString(),
          likeCount: post.likeCount,
          postId: post._id.toString(),
          author: {
            __typename: "User",
            id: userInBd._id.toString(),
            name: userInBd.name,
            avatar: userInBd.avatar || "",
          },
        };

        console.log(postWithLikes, "siiii", post.likeCount);

        return postWithLikes;
      } catch (error) {
        console.error("Error detalle:", error);
        throw new ApolloError("Error al dar like:", error);
      }
    },

    removeLike: async (_, { postId }, { user }) => {
      if (!user) throw new Error("Usuario no autenticato!");

      const post = await Posts.findById(postId);

      if (!post) throw new Error("pos no encontrado");

      const likedIndex = post.likes.findIndex((like) => like.equals(user.id));
      if (likedIndex === -1) throw new Error("no has dado megusta a este post");

      post.likes.splice(likedIndex, 1);
      post.likeCount = post.likes.length;

      await post.save;

      return post;
    },

    SendFriendRequest: async (_, { toUserId }, context) => {
      if (!context.user.userId) {
        throw new AuthenticationError(
          "Debes iniciar sesión para enviar solicitudes de amistad."
        );
      }
      const existingRequest = await Friendship.findOne({
        fromUser: context.user.userId,
        toUser: toUserId,
      });
      if (existingRequest) {
        throw new ApolloError(
          "Ya has enviado una solicitud de amistad a este usuario."
        );
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
