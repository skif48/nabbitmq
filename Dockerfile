FROM rabbitmq:3.7.8

RUN apt-get update
RUN apt-get -y install wget
RUN apt-get -y install unzip
RUN wget https://dl.bintray.com/rabbitmq/community-plugins/3.7.x/rabbitmq_delayed_message_exchange/rabbitmq_delayed_message_exchange-20171201-3.7.x.zip
RUN unzip rabbitmq_delayed_message_exchange-20171201-3.7.x.zip
RUN mv rabbitmq_delayed_message_exchange-20171201-3.7.x.ez /usr/lib/rabbitmq/lib/rabbitmq_server-3.7.8/plugins
RUN rabbitmq-plugins enable rabbitmq_management
RUN rabbitmq-plugins enable rabbitmq_delayed_message_exchange
