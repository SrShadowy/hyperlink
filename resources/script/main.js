   
   
 const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const currentTheme = localStorage.getItem('theme') || 'dark';
    body.classList.add(currentTheme + '-theme');

    themeToggle.addEventListener('click', () => {
      const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
      body.classList.remove('dark-theme', 'light-theme');
      body.classList.add(newTheme + '-theme');
      localStorage.setItem('theme', newTheme);
      themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    themeToggle.innerHTML = currentTheme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';

    const createLinkElement = (link, className = 'topic-link') => {
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noreferrer noopener';
      a.className = className;

      if (link.icon && link.icon.trim().length > 0) {
        const icon = link.icon.trim();
        if (icon.includes('.') || icon.includes('/')) {
          const src = icon.includes('/') ? icon : `resources/icons/${icon}`;
          a.innerHTML = `<img src="${src}" alt="" class="link-icon-img"> ${link.nome}`;
        } else {
          const iconHTML = createIconHTML(icon);
          a.innerHTML = iconHTML.replace('<i class="', '<i class="link-icon ') + ` ${link.nome}`;
        }
      } else {
        a.textContent = link.nome;
      }
      return a;
    };

    fetch('./resources/data.json')
      .then(res => res.json())
      .then(data => {

        document.getElementById('profile').src = data.profile;
        document.getElementById('name').innerText = data.name;
        document.getElementById('description').innerText = data.description;

        if(data.background) {
          document.body.style.backgroundImage = data.background ? `url(${data.background})` : 'none';
        }


        data.theme = data.theme || 'dark';
        if (data.theme === 'light') {
          document.getElementById('theme-toggle').click();
        }

        const redesContainer = document.getElementById('redes');
        data.redes.forEach(r => {
          const a = document.createElement('a');
          a.href = r.url;
          a.target = "_blank";
          a.innerHTML = `<i class="${r.icon}"></i>`;
          redesContainer.appendChild(a);
        });


        const pastasContainer = document.getElementById('pastas');
        const topics = {};
        const topicLinks = {};

        data.pastas.forEach(p => {
          if (!topics[p.topic]) {
            topics[p.topic] = [];
          }
          topics[p.topic].push(p);
        });

        if (data.links) {
          data.links.forEach(link => {
            if (!topicLinks[link.topic]) {
              topicLinks[link.topic] = [];
            }
            topicLinks[link.topic].push(link);
          });
        }

        const allTopics = new Set([...Object.keys(topics), ...Object.keys(topicLinks)]);

        for (const topic of allTopics) {
          const topicDiv = document.createElement('div');
          topicDiv.classList.add('topic');
          const topicTitle = document.createElement('h2');
          topicTitle.innerText = topic;
          topicDiv.appendChild(topicTitle);

          if (topicLinks[topic] && topicLinks[topic].length) {
            const directLinksDiv = document.createElement('div');
            directLinksDiv.classList.add('topic-links');
            topicLinks[topic].forEach(link => {
              directLinksDiv.appendChild(createLinkElement(link, 'topic-link'));
            });
            topicDiv.appendChild(directLinksDiv);
          }

          if (topics[topic] && topics[topic].length) {
            const foldersDiv = document.createElement('div');
            foldersDiv.classList.add('topic-folders');
            topics[topic].forEach(p => {
              const folderItem = document.createElement('div');
              folderItem.classList.add('folder-item');

              const folderToggle = document.createElement('button');
              folderToggle.type = 'button';
              folderToggle.classList.add('folder-toggle');
              folderToggle.innerHTML = `
                <span><img src="resources/icons/${p.Icon}" alt="${p.nome}" class="folder-icon"> ${p.nome}</span>
                <span class="folder-arrow">+</span>
              `;
              folderItem.appendChild(folderToggle);

              if (p.links && p.links.length) {
                const linksWrapper = document.createElement('div');
                linksWrapper.classList.add('folder-links');
                linksWrapper.style.display = 'none';

                p.links.forEach(link => {
                  linksWrapper.appendChild(createLinkElement(link, 'folder-link'));
                });

                folderToggle.addEventListener('click', () => {
                  const isOpen = linksWrapper.style.display === 'block';
                  linksWrapper.style.display = isOpen ? 'none' : 'block';
                  folderToggle.querySelector('.folder-arrow').innerText = isOpen ? '+' : '−';
                });

                folderItem.appendChild(linksWrapper);
              } else {
                const a = createLinkElement({
                  nome: p.nome,
                  url: p.link || '#',
                  icon: p.Icon ? `resources/icons/${p.Icon}` : undefined
                }, 'folder-link');
                folderItem.appendChild(a);
                folderToggle.replaceWith(a);
              }

              foldersDiv.appendChild(folderItem);
            });
            topicDiv.appendChild(foldersDiv);
          }

          pastasContainer.appendChild(topicDiv);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar data.json:', err);
      });