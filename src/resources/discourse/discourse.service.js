import { Data } from '../tool/data.model';
import axios from 'axios';

export async function findPostsByTopicId(topicId) {
    const config = {
        headers: {
            'Api-Key': process.env.DISCOURSE_API_KEY,
            'Api-Username': 'admin',
            'user-agent': 'node.js',
        }
      };
    
      try {
        const response = await axios.get(
          `${process.env.DISCOURSE_URL}/t/${topicId}.json`,
          config
        );

        // The first post is the actual topic so we need to remove it.
        const posts = response.data.post_stream.posts.slice(1, response.data.post_stream.posts.length);

        return posts;
      } catch (err) {
          console.error(err);
      }
} 

export async function createDiscourseTopic(tool) {
    const config = {
      headers: {
        'Api-Key': process.env.DISCOURSE_API_KEY,
        'Api-Username': 'admin',
        'user-agent': 'node.js',
        'Content-Type': 'application/json',
      }
    };

    const payload = {
        title: tool.name,
        raw: `${tool.description} <br> Original content: ${process.env.homeURL}/tool/${tool.id}`,
        category: process.env.DISCOURSE_CATEGORY_TOOLS_ID,
    }

    try {
        const res = await axios.post(`${process.env.DISCOURSE_URL}/posts.json`, payload, config);
        if (res.data.topic_id) {
            await Data.findOneAndUpdate({ id: tool.id }, { $set: { discourseTopicId: res.data.topic_id }});
        }
    } catch (err) {
        console.error(err);
    }
  }