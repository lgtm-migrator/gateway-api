import { Data } from '../tool/data.model';
import axios from 'axios';

export async function findPostsByTopicId(topicId) {
  if (!topicId) {
    throw new Error("Topic can't be null");
  }

  const config = {
    headers: {
      'Api-Key': process.env.DISCOURSE_API_KEY,
      'Api-Username': 'system',
      'user-agent': 'node.js',
    },
  };

  try {
    const response = await axios.get(
      `${process.env.DISCOURSE_URL}/t/${topicId}.json`,
      config
    );

    // The first post is the actual topic so we need to remove it.
    let posts = response.data.post_stream.posts.slice(
      1,
      response.data.post_stream.posts.length
    );

    posts.map((post) => {
        post.avatar_template = `${process.env.DISCOURSE_URL}${post.avatar_template.replace('{size}', '46')}`
    });

    return {
      link: `${process.env.DISCOURSE_URL}/t/${response.data.slug}/${topicId}`,
      posts: posts,
    };
  } catch (err) {
    console.error(err);
  }
}

export async function createDiscourseTopic(tool) {
  const config = {
    headers: {
      'Api-Key': process.env.DISCOURSE_API_KEY,
      'Api-Username': 'system',
      'user-agent': 'node.js',
      'Content-Type': 'application/json',
    },
  };
  
  var rawIs, categoryIs;
  if (tool.type === 'tool') {
    rawIs = `${tool.description} <br> Original content: ${process.env.homeURL}/tool/${tool.id}`;
    categoryIs = process.env.DISCOURSE_CATEGORY_TOOLS_ID;
  }
  else if (tool.type === 'project') {
    rawIs = `${tool.description} <br> Original content: ${process.env.homeURL}/project/${tool.id}`;
    categoryIs = process.env.DISCOURSE_CATEGORY_PROJECTS_ID;
  }
  else if (tool.type === 'dataset') {
      var description = tool.description || tool.abstract;
    rawIs = `${description} <br> Original content: ${process.env.homeURL}/dataset/${tool.datasetid}`;
    categoryIs = process.env.DISCOURSE_CATEGORY_DATASETS_ID;
  }
  else if (tool.type === 'paper') {
    rawIs = `${tool.description} <br> Original content: ${process.env.homeURL}/paper/${tool.id}`;
    categoryIs = process.env.DISCOURSE_CATEGORY_PAPERS_ID;
  }

  const payload = {
    title: tool.name,
    raw: rawIs,
    category: categoryIs
  };

  try {
    const res = await axios.post(
      `${process.env.DISCOURSE_URL}/posts.json`,
      payload,
      config
    );
    if (res.data.topic_id) {
      await Data.findOneAndUpdate(
        { id: tool.id },
        { $set: { discourseTopicId: res.data.topic_id } }
      );

      return res.data.topic_id;
    }
  } catch (err) {
    console.error(err);
  }
}
