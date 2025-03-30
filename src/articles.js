const express = require("express");
const mongoose = require("mongoose");
const isLoggedIn = require("./auth").isLoggedIn; // Import the isLoggedIn middleware
const router = express.Router();

// Article schema definition
const articleSchema = new mongoose.Schema({
    pid: { type: Number, required: true},
    author: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    image: { type: String, default:"" },
    date: { type: Date, required: true, default: Date.now },
    comments: { type: Array, default: [] },
    likes: { type: [String], default: [] }
});

const Article = mongoose.model("Article", articleSchema);


router.get("/articles", isLoggedIn, async (req, res) => {
    try {
        // Extract followers from request body
        const followersParam = req.query.followers;

        // Convert comma-separated string to array
        const followers = followersParam
            ? followersParam.split(',').map(follower => follower.trim())
            : [];
        // Combine current user and followers into a single array of usernames
        const usernames = [req.user, ...followers];

        // Find articles from current user and their followers
        const articles = await Article.find({
            // Match articles where the author's username is in the list
            'author': { $in: usernames }
        })
            .sort({ createdAt: -1 }) // Sort by most recent first
            .populate('author', 'username profilePicture') // Populate author details
            .lean(); // Convert to plain JavaScript object for better performance

        // Return the articles
        res.status(200).json({
            articles,
            totalArticles: articles.length
        });
    } catch (err) {
        console.error("Error fetching articles:", err);
        res.status(500).json({
            message: "Server error while fetching articles",
            error: err.message
        });
    }
});


// POST /article - Create a new article
// POST /article
router.post("/article", isLoggedIn, async (req, res) => {
    const { title, text, url } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Article text is required." });
    }
    if (!title) {
        return res.status(400).json({ message: "Article title is required." });
    }
    try {
        // Fetch the latest article by the logged-in user and get its pid
        const lastArticle = await Article.findOne({ author: req.user })
            .sort({ pid: -1 }) // Sort by pid in descending order to get the latest
            .exec();

        const newPid = lastArticle ? lastArticle.pid + 1 : 1; // If no articles, start with pid = 1

        // Create the new article
        const newArticle = new Article({
            pid: newPid,
            author: req.user, // Author from isLoggedIn middleware
            title,
            text,
            image:url,
            date: new Date(), // Current timestamp
        });

        // Save the article in the database
        await newArticle.save();
        const articles = await Article.find({ author: req.user });
        res.status(200).json(articles);
    } catch (err) {
        console.error("Error creating article:", err);
        res.status(500).json({ message: "Server error." });
    }
});

router.get("/articles/:id/likes", isLoggedIn, async (req, res) => {
    try {
        const articleId = req.params.id;
        // 查询指定文章，只选择 likes 字段
        const postId = new mongoose.Types.ObjectId(articleId);
        const article = await Article.findById(postId).select("likes");

        if (!article) {
            return res.status(404).json({ message: "Posts not Found!" });
        }

        res.status(200).json({
            likes: article.likes
        });
    } catch (err) {
        console.error("获取 likes 失败:", err);
        res.status(500).json({
            message: "Errors: Obtain Likes Fails",
            error: err.message
        });
    }
});


router.post("/articles/:id/likes", isLoggedIn, async (req, res) => {
    try {
        const articleId = req.params.id;
        const { name } = req.body;

        const postId = new mongoose.Types.ObjectId(articleId);

        if (!name) {
            return res.status(400).json({ message: "必须提供名字" });
        }

        // 使用 $addToSet 避免重复添加
        const updatedArticle = await Article.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: name } },
            { new: true }
        ).select("likes");

        if (!updatedArticle) {
            return res.status(404).json({ message: "文章未找到" });
        }

        res.status(200).json({
            likes: updatedArticle.likes
        });
    } catch (err) {
        console.error("添加 likes 失败:", err);
        res.status(500).json({
            message: "添加文章 likes 时服务器出错",
            error: err.message
        });
    }
});

router.delete("/articles/:id/:name?/likes", isLoggedIn, async (req, res) => {
    try {
        const articleId = req.params.id;
        const name = req.params.name

        const postId = new mongoose.Types.ObjectId(articleId);

        if (!name) {
            return res.status(400).json({ message: "必须提供名字" });
        }

        // 使用 $pull 操作符从数组中移除指定名字
        const updatedArticle = await Article.findByIdAndUpdate(
            postId,
            { $pull: { likes: name } },
            { new: true }
        ).select("likes");

        if (!updatedArticle) {
            return res.status(404).json({ message: "文章未找到" });
        }

        res.status(200).json({
            likes: updatedArticle.likes
        });
    } catch (err) {
        console.error("删除 likes 失败:", err);
        res.status(500).json({
            message: "删除文章 likes 时服务器出错",
            error: err.message
        });
    }
});

router.put("/articles/:id", async (req, res) => {
    try {
        const postId = req.params.id; // Get the post ID from the URL
        const username = req.user;
        const { text, commentId } = req.body; // Get text and commentId from the request body

        // Validate input
        if (!username || !text) {
            return res.status(400).json({error: 'Username and text are required.'});
        }

        const objectId = new mongoose.Types.ObjectId(postId);

        // Check if commentId is not provided (undefined or null)
        if (commentId === undefined || commentId === null) {
            const post = await Article.findById(objectId);

            if (!post) {
                return res.status(404).json({error: 'Post not found.'});
            }

            // Only allow update if the current user is the post author
            if (post.author !== username) {
                return res.status(403).json({error: 'You are not authorized to edit this post.'});
            }

            // Update the post text
            const updatedPost = await Article.findByIdAndUpdate(
                objectId,
                { text }, // Update the post text
                { new: true } // Return the updated document
            );

            return res.status(200).json(updatedPost);
        }

        // If commentId is -1, add a new comment
        if (commentId === -1) {
            const updatedPost = await Article.findByIdAndUpdate(
                objectId,
                {
                    $push: {
                        comments: {
                            username,
                            comment: text
                        }
                    }
                }, // Add the new comment to the "comments" array
                { new: true } // Return the updated document
            );

            if (!updatedPost) {
                return res.status(404).json({error: 'Post not found.'});
            }

            return res.status(200).json(updatedPost);
        }

        if (commentId === 1) {
            const updatedPost = await Article.findByIdAndUpdate(
                objectId,
                {
                    $set: {
                        'comments.$[elem].comment': text
                    }
                },
                {
                    arrayFilters: [{ 'elem.username': req.user}],
                    new: true
                } // Return the updated document
            );

            if (!updatedPost) {
                return res.status(404).json({error: 'Post not found.'});
            }

            return res.status(200).json(updatedPost);
        }

        // If commentId is provided but not -1, handle it as a comment edit/update
        // You can add additional logic here if needed

        res.status(400).json({error: 'Invalid request.'});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Failed to process request.'});
    }
});

// 删除评论的路由
router.delete("/articles/:id/comments/:commentIndex", async (req, res) => {
    try {
        const postId = req.params.id;
        const commentIndex = parseInt(req.params.commentIndex);
        const username = req.user;

        if (isNaN(commentIndex)) {
            return res.status(400).json({ error: 'Invalid comment index.' });
        }

        const objectId = new mongoose.Types.ObjectId(postId);
        
        // 查找文章
        const post = await Article.findById(objectId);
        
        if (!post) {
            return res.status(404).json({ error: 'Post not found.' });
        }
        
        // 检查评论是否存在
        if (!post.comments || commentIndex >= post.comments.length) {
            return res.status(404).json({ error: 'Comment not found.' });
        }
        
        // 检查当前用户是否是评论的作者
        if (post.comments[commentIndex].username !== username) {
            return res.status(403).json({ error: 'You can only delete your own comments.' });
        }
        
        // 删除评论
        post.comments.splice(commentIndex, 1);
        
        // 保存更新后的文章
        await post.save();
        
        return res.status(200).json({ 
            message: 'Comment deleted successfully.',
            comments: post.comments 
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment.' });
    }
});

// 删除帖子的路由
router.delete("/articles/:id", async (req, res) => {
    try {
        const postId = req.params.id;
        const username = req.user;

        const objectId = new mongoose.Types.ObjectId(postId);
        
        // 查找文章
        const post = await Article.findById(objectId);
        
        if (!post) {
            return res.status(404).json({ error: '帖子未找到' });
        }
        
        // 检查当前用户是否是帖子的作者
        if (post.author !== username) {
            return res.status(403).json({ error: '您只能删除自己的帖子' });
        }
        
        // 删除帖子
        await Article.findByIdAndDelete(objectId);
        
        return res.status(200).json({ 
            message: '帖子删除成功'
        });
    } catch (error) {
        console.error('删除帖子时出错:', error);
        res.status(500).json({ error: '删除帖子失败' });
    }
});

module.exports = {router,Article};
