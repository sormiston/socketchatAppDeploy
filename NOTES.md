### Custom implementations...

1. Adapt the welcome message on chatroom join to be a PRIVATE message only to the newly joined user
    * Will require storing Socket#Id as a browser side variable.  What is best practice for server-emitting and storing?
    DONE (just address message to socket.id - easy)