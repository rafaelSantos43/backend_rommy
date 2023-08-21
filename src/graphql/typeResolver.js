import Comment from "../models/Comments.js";
import User from "../models/User.js";
import Posts from "../models/Posts.js";
import Jwt from "jsonwebtoken";
import fs, { createReadStream } from "fs";
import path from "path";
import fetch from "node-fetch";
import multer from "multer";
import mongoose from "mongoose";

//const { ObjectId } = require("mongoose").Types;
import { PubSub, withFilter } from "graphql-subscriptions";

const pubSub = new PubSub();

const resolvers = {
  Query: {
    GetUserAll: async (_, { id }) => {
      //console.log('mi id--->',id);
      try {
        const users = await User.find();
        const myUsers = users.filter((user) => !user._id.equals(id));
        // console.log("------>", myUsers);
        return myUsers;
      } catch (error) {
        console.warn("Error al traer la lista", error.message);
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
  },

  Mutation: {
    CreateUser: async (_, { input }) => {
      // console.log("data user-->>>", input);
      const user = new User({
        ...input,
      });
      await user.save();
      return user;
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
        "secret123",
        { expiresIn: "1h" }
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

    CreatePost: async (_, { input }) => {
      try {
        const newPost = new Posts({
          title: input.title,
          content: input.content,
          imageUrl: input.imageUrl,
          author: {
            id: input.author.id,
            name: input.author.name,
            avatar: input?.author?.avatar,
          },
        });

        await newPost.save();
        return newPost;
      } catch (error) {
        throw new ApolloError("Error al crear el post:", error);
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
  }, 

  Subscription: { 
    NewComment: {
      subscribe: withFilter(
        () => pubSub.asyncIterator("New_Comment"),
        (payload, variables) => {
          console.log(payload, '-----a');
          const postId = mongoose.Types.ObjectId(payload.postId); // Convertir a ObjectId
          const requestedPostId = mongoose.Types.ObjectId(variables.postId);
          return postId.equals(requestedPostId);
        }
      ),
      resolve: (payload) => {
        return payload; // Devolver la información del nuevo comentario
      },
    },
  },
};

export default resolvers;
