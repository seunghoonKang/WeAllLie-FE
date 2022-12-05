import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';
// import { socket } from '../shared/socket';
import { useRef } from 'react';
import { useCookies } from 'react-cookie';
// import { useBeforeunload } from 'react-beforeunload'; // 새로고침방지
import { ReactComponent as ChatProfileDefault } from '../assets/chat_profile_default.svg';
import { ReactComponent as ChatProfileLion } from '../assets/chat_profile_lion.svg';
import { ReactComponent as PersonIcon } from '../assets/icon_person.svg';
import { ReactComponent as SendIcon } from '../assets/icon_send.svg';

//민형님 주소
import { io } from 'socket.io-client';
export const socket = io('https://minhyeongi.xyz', {
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
});

const Chat = () => {
  const param = useParams();
  const themeContext = useContext(ThemeContext);
  const navigate = useNavigate();
  //채팅방 열고닫기 구현하려면 {showChat} props로 받아오기
  const [cookies, setCookie] = useCookies(['nickname']);
  const nickname = cookies.nickname;
  const [userCnt, setUserCnt] = useState(0);
  const [chat, setChat] = useState([
    // { notice: '뀨띠님이 입장하셨습니다' },
    // { name: '뀨띠', msg: '안눙' },
  ]);
  const [roomChat, setRoomChat] = useState([]);

  const msgInput = useRef();

  //접속 인원 수
  socket.on('userCount', (people) => {
    setUserCnt(people);
  });

  //스크롤 구현
  const scrollRef = useRef();
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  //로비채팅 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  //룸채팅 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [roomChat]);

  useEffect(() => {
    if (param.id === undefined) {
      console.log('로비얌');
      //로비 들어왔을 때 실행
      socket.emit('enterLobby', nickname, () => {
        setChat([...chat, { notice: `${nickname} 님이 입장하셨습니다` }]);
      });
    } else {
      console.log('룸이얌');
      //룸 들어왔을 때 실행
      socket.emit('enterRoomMsg', param.id, nickname, () => {
        setRoomChat([
          ...roomChat,
          { notice: `${nickname} 님이 입장하셨습니다` },
        ]);
      });
    }
  }, []);

  const myLobbyMsg = (a) => {
    setChat([...chat, a]);
  };

  const myRoomMsg = (a) => {
    setRoomChat([...roomChat, a]);
  };

  const msgSubmitHandler = (e) => {
    e.preventDefault();
    const msgValue = msgInput.current.value;

    //내가 적은 msg (나한테만 보임)
    //채팅에 닉네임, 메세지 전송 (emit)
    const mine = { name: `${nickname}`, msg: `${msgValue}` };
    // console.log(mine);
    //myMsg(mine);

    if (param.id === undefined) {
      //내가 적은 msg
      //나를 제외한 모든 사람들한테 메세지를 보여주도록 emit
      socket.emit(
        'sendLobbyMsg',
        { name: `${nickname}`, msg: `${msgValue}` },
        () => {
          //나한테 띄워줄 내가 보낸 메세지 추가
          myLobbyMsg(mine);
        }
      );
      msgInput.current.value = '';
    } else {
      socket.emit(
        'sendRoomMsg',
        { name: `${nickname}`, msg: `${msgValue}` },
        param.id,
        () => {
          //나한테 띄워줄 내가 보낸 메세지 추가
          myRoomMsg(mine);
        }
      );
      msgInput.current.value = '';
    }

    //남이 보낸 메세지 받아오기
    if (param.id === undefined) {
      //로비msg
      socket.on('receiveLobbyMsg', (msg) => {
        setChat([...chat, msg]);
      });
    } else {
      //룸msg
      socket.on('receiveRoomMsg', (msg) => {
        //console.log(msg);
        setRoomChat([...roomChat, msg]);
      });
    }
    //퇴장시 실행 (아마도 자동실행?)
    //socket.emit('disconnecting', param.id, nickname);
  };

  // console.log('param확인', param.id);
  return (
    <ChatLayout theme={themeContext}>
      <MyProfile onClick={() => navigate(`/user/`)}>
        {/* 나중에 user 는 모달로 할수도 */}
        My ∨
      </MyProfile>
      <ChatTop>
        <p style={{ fontSize: '30px' }}>CHAT</p>
        <People>
          <PersonIcon style={{ marginRight: '6px' }} />
          {userCnt}
        </People>
      </ChatTop>
      <ChatRow ref={scrollRef}>
        <Notice>매너 채팅 안하면 벤먹는다!</Notice>

        {chat.map((a, index) => {
          return a.notice ? (
            <Notice key={index}>{a.notice}</Notice>
          ) : (
            a.msg &&
              (a.name == nickname ? (
                <Msg
                  theme={themeContext}
                  key={index}
                  style={{ justifyContent: 'flex-end' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                    }}
                  >
                    <Nickname>{a.name}</Nickname>
                    <Word>{a.msg}</Word>
                  </div>
                  <User>
                    <ChatProfileDefault />
                    {/* <ChatProfileLion /> */}
                  </User>
                </Msg>
              ) : (
                <Msg theme={themeContext} key={index}>
                  <User>
                    <ChatProfileDefault />
                    {/* <ChatProfileLion /> */}
                  </User>
                  <div>
                    <Nickname>{a.name}</Nickname>
                    <Word>{a.msg}</Word>
                  </div>
                </Msg>
              ))
          );
        })}
      </ChatRow>
      <Form onSubmit={msgSubmitHandler}>
        {/* <p>프로필?</p> */}
        <input type="text" ref={msgInput} placeholder="여따 할말혀!" required />
        <button>
          <SendIcon />
        </button>
      </Form>
    </ChatLayout>
  );
};

export default Chat;

const ChatLayout = styled.div`
  padding: 18px;
  margin-top: 60px;
  width: 350px;
  height: calc(90vh - 60px);
  min-height: 590px;
  background-color: #fff;
  border-radius: 10px;
  position: relative;
  margin-left: 10px;

  /* //채팅방 열고 닫기 코드
  position: absolute;
  top: 0;
  ${(props) => (props.showChat ? 'right:0;' : 'right:-360px;')}
  visibility: ${(props) => (props.showChat ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.showChat ? '1' : '0')};
  transition: all 400ms ease-in-out;*/
`;

const MyProfile = styled.button`
  width: 60px;
  height: 40px;
  position: absolute;
  top: -52px;
  right: 0;
  border: 1px solid #fff;
  border-radius: 6px;
  font-size: 14px;
  color: #fff;
  /* padding: 20px; */
`;

const People = styled.p``;
const ChatTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: center;
  height: 10%;
  margin-left: 10px;
  padding: 3% 0 5% 0;
  p {
    font-weight: bold;
  }
  ${People} {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${(props) => props.theme.color.gray1};
    padding: 10px;
    margin: 4% 0 4% 0;
    height: 20px;
    border-radius: 6px;
    font-size: 12px;
  }
`;
const Nickname = styled.p``;
const User = styled.p``;
const Notice = styled.div``;
const Msg = styled.div``;
const Word = styled.p``;
const ChatRow = styled.div`
  /* background-color: lightgreen; */
  width: 100%;
  height: 80%;
  /* min-height: 460px; */
  overflow-y: auto;

  ${Notice} {
    text-align: center;
    line-height: 30px;
    padding: 1px;
    color: gray;
    font-size: 12px;
  }

  ${Msg} {
    margin: 5px;
    display: flex;

    ${User} {
      width: 30px;
      height: 30px;
      background-color: ${(props) => props.theme.color.gray2};
      border-radius: 15px;
      text-align: center;
      margin-right: 10px;
    }

    ${Nickname} {
      font-weight: 700;
      margin-bottom: 5px;
      margin-right: 10px;
      font-size: 14px;
    }

    ${Word} {
      display: inline-block;
      background-color: ${(props) => props.theme.color.gray2};
      border-radius: 6px;
      padding: 8px 10px;
      margin-right: 10px;
      font-size: 14px;
      word-break: break-all; //띄어쓰기 안해도, 단어 중간에서 줄바꿈 가능하게 함
    }
  }
`;

const Form = styled.form`
  display: flex;
  /* justify-content: space-between; */
  margin: 4% 0 4% 0;
  padding: 3% 0 3% 0;
  height: 10%;
  min-height: 40px;

  p {
    padding: 5px 0;
  }
  input {
    background-color: ${(props) => props.theme.color.gray1};
    width: 90%;
    padding: 0 10px;
    border-radius: 6px 0 0 6px;
    &:focus {
      outline: none;
    }
  }
  button {
    width: 10%;
    background-color: ${(props) => props.theme.color.gray1};
    border-radius: 0 6px 6px 0;
  }
`;
