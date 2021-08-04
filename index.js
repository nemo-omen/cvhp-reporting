const fs = require('fs');
const path = require('path');
const WPAPI = require('wpapi');
const XLSX = require('xlsx');


const notionToken = process.env.NOTION_TOKEN;

const date = new Date(Date.now()).toLocaleDateString();


var wp = new WPAPI({
  endpoint: 'https://www.conchovalleyhomepage.com/wp-json',
});

const getPosts = async () => {
  return await wp.posts().param('after', new Date(date)).perPage(100).get(async (error, data) => {
    if(error) {
      console.error(error);
    }

    return await data;
  });
};

const users = {
  3364: {
    name: 'James Smith',
    id: 3364,
    postCount: 0,
    postTimes: [],
  },
  4800: {
    name: 'Brittany Lawrence',
    id: 4800,
    postCount: 0,
    postTimes: [],
  },
  4519: {
    name: 'Kris Boone',
    id: 4519,
    postCount: 0,
    postTimes: [],
  },
  3477: {
    name: 'Senora Scott',
    id: 3477,
    postCount: 0,
    postTimes: [],
  },
  2308: {
    name: 'Jeff Caldwell',
    id: 2308,
    postCount: 0,
    postTimes: [],
  }
};

const getPostsWithUsers = (postData) => {
  postData.forEach((post) => {
    if(users[post.author]) {
      const postInfo = {
        authorName: users[post.author],
        date: new Date(post.date).toLocaleString(),
      }
      users[post.author].postCount ++;
      users[post.author].postTimes.push(postInfo.date);
      users[post.author].postTimes = users[post.author].postTimes.sort((a, b) => new Date(a) < new Date(b) ? -1 : 1);
    }
  });
};

const generateHTMLTable = (userData) => {
  // console.log(Object.values(userData).map((user) => user.name));
  return `<table>
    <tr>
      <th>Name</th>
      <th># of Posts</th>
    </tr>
    ${Object.values(userData).map((user) => {
      return `
      <tr>
      <td>${user.name}</td>
      <td>${user.postCount}</td>
      </tr>
      `
    }).join().replace(/,/g, '')}
  </table>`;
}

const writeHTMLToFile = (html) => {
  fs.writeFileSync(path.join(__dirname, 'report.html'), html, 'utf8');
}

// looks like this is browser only
// unless we can just do it with node DOM
const writeTableToXLSX = (table) => {
  const sheet = XLSX.utils.table_to_sheet(table);
  XLSX.writeFile(sheet, 'report.xlsx');
};

const writeArrayToXLSX = (array) => {
  const parsedDate = new Date(date).toISOString().replace(/T.*/,'').split('-').reverse().join('-');
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(array);
  XLSX.utils.book_append_sheet(wb, sheet, `${parsedDate} Daily Posts`);
  XLSX.writeFile(wb, 'report.xlsx');
};

getPosts().then((data) => {
  getPostsWithUsers(data);
  // console.log(users);
  const table = generateHTMLTable(users);
  const html = `<html>
  <head>
    <style>
      table, th, td {
        border: 1px solid black;
      }
      th, td {
        padding: 0.5rem;
        text-align: center;
      }
    </style>
  </head>
    <body>
    <h2>Posts for ${date}</h2>
      ${table}
    </body>
  </html>`;

  console.log(html);
  writeHTMLToFile(html);
  
  const manicured = Object.values(users).map((user) => {
    return {
      "Name": user.name,
      "Post Count": user.postCount
    }
  })
  writeArrayToXLSX(manicured);
});

