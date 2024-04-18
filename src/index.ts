import express from 'express';
import { createServer } from 'http';
import usersRouters from '~/routers/usersRouters';
import mediasRouters from '~/routers/mediasRouters';
import tweetsRouters from '~/routers/tweetsRouters';
import projectsRouters from '~/routers/projectsRouters';
import searchRouters from '~/routers/searchRouters';
import conversationsRouters from '~/routers/conversationsRouters';
import groupsRouters from '~/routers/groupsRouters';
import db from './services/databaseServices';
import { defaultsErrorHandler } from './middlewares/errorsMiddlewares';
import cors, { CorsOptions } from 'cors';
import initializeSocket from './utils/socket';
import { env, isProduction } from './constants/config';
import helmet from 'helmet';

const app = express();
const httpServer = createServer(app);

db.connect().then(() => {
  // db.indexUsersCollection();
  // db.indexTweetsCollection();
});

const corsConfig: CorsOptions = {
  origin: isProduction ? env.clientUrl : '*'
};

app.use(helmet());
app.use(cors(corsConfig));
app.use(express.json());

initializeSocket(httpServer);
app.use('/users', usersRouters);
app.use('/medias', mediasRouters);
app.use('/tweets', tweetsRouters);
app.use('/projects', projectsRouters);
app.use('/search', searchRouters);
app.use('/conversations', conversationsRouters);
app.use('/groups', groupsRouters);
app.use(defaultsErrorHandler);

const port = env.port || 3030;
httpServer.listen(port, () => console.log('GuLancer server is running port: ' + port));
