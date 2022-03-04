import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import FilledDatePicker from "../../components/FilledDatePicker/FilledDatePicker";
import Button from "react-bootstrap/Button";
import { withTranslation } from "react-i18next";
import {
  ToastsContainer,
  ToastsContainerPosition,
  ToastsStore,
} from "react-toasts";
import { UTCFormat } from "../../constants/constants";
import { Api } from "../../api/Api";
import GetAPIHeader from "../../api/ApiCaller";
import ErrorHandling from "../../api/ErrorHandling";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ConfirmPopup from "../../components/Modal/LogoutDialog";
import $ from "jquery";
import moment from "moment";
import SelectMemberModal from "../../components/SelectMember/selectMemberModal";
import Avatar from "@material-ui/core/Avatar";
import StorageUtils from "../../containers/utils/StorageUtils";

const Storage = new StorageUtils();

const maxDescCount = 250;
const maxChoiceCount = 75;

class CreatePoll extends Component {
  constructor(props) {
    super(props);
    this.choiceInput = React.createRef();
    this.questionInput = React.createRef();
    this.state = {
      msgCount: 0,
      pollTitle: "",
      choiceExceedMsg: "",
      singleChoiceSelected: true,
      multiChoiceSelected: false,
      selectedChoiceEle: "",
      pollQuestionErrMsg: "",
      choiceDuplicateErrMsg: "",
      choiceEmptyErrMsg: "",
      selectedChoiceIndex: null,
      pollQuestionSelected: false,
      showCloseModal: false,
      duplicateIdx: [],
      pollChoices: [
        {
          text: "",
          placeHolder: "Enter Choice",
          draggableId: "draggable-0",
        },
        {
          text: "",
          placeHolder: "Enter Choice",
          draggableId: "draggable-1",
        },
      ],
      endDate: moment(new Date(), "DD/MM/YYYY").add(1, "days"),
      openSelectMembersPopup: false,
      selectedMembers: [],
      selectedUnits: [],
      pollAudience: [],
      editMember: false,
      editGroup: false,
    };
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside, true);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside, true);
  }

  handleClickOutside = (event) => {
    let duplicateIdxGrp = this.state.duplicateIdx;
    let pollChoices = this.state.pollChoices;
    let selIdx = duplicateIdxGrp && duplicateIdxGrp[0];
    if (duplicateIdxGrp.length) {
      duplicateIdxGrp.splice(
        duplicateIdxGrp.findIndex((item) => item === selIdx),
        1
      );
      pollChoices[selIdx].text = "";
      this.setState({
        duplicateIdx: duplicateIdxGrp,
        pollChoices: pollChoices,
      });
    }

    if (
      (event.target && event.target.id) !==
      (this.choiceInput.current && this.choiceInput.current.id)
    ) {
      this.setState({ selectedChoiceIndex: null });
    }

    if (
      (event.target && event.target.id) !==
      (this.questionInput.current && this.questionInput.current.id)
    ) {
      this.setState({ pollQuestionSelected: false });
    }
  };

  handleChange = (evt) => {
    this.setState({
      [evt.target.name]: evt.target.value,

      pollQuestionErrMsg: "",
    });
  };

  handleChoiceChange = (evt, indx) => {
    const { t } = this.props;
    const { pollChoices, errChoiceIdx, choiceDuplicateErrMsg } = this.state;
    let duplicateIdxGrp = this.state.duplicateIdx;
    let isDuplicate = pollChoices.some((item, idx) => {
      if (evt.target.value.trim() === "") {
        return false;
      } else if (item.text === evt.target.value) {
        return true;
      }
    });
    pollChoices.map((item) => {
      if (evt.target.value.trim() !== "" && item.text === evt.target.value) {
        if (!duplicateIdxGrp.includes(indx)) {
          duplicateIdxGrp.push(indx);
        }
      }
    });
    if (isDuplicate) {
      pollChoices[indx].text = evt.target.value;
      pollChoices[indx].draggableId = "draggable-" + indx;
      this.setState({
        choiceDuplicateErrMsg: t("polls.pollOptionsValidationMsg"),
        errChoiceIdx: indx,
        duplicateIdx: duplicateIdxGrp,
        pollChoices: pollChoices,
        selectedChoiceEle: pollChoices[indx].text,
      });
    } else {
      duplicateIdxGrp.includes(indx) &&
        duplicateIdxGrp.splice(
          duplicateIdxGrp.findIndex((item) => item == indx),
          1
        );
      pollChoices[indx].text = evt.target.value;
      pollChoices[indx].draggableId = "draggable-" + indx;
      this.setState({
        pollChoices: pollChoices,
        selectedChoiceEle: pollChoices[indx].text,
        choiceDuplicateErrMsg: duplicateIdxGrp.length
          ? choiceDuplicateErrMsg
          : "",
        duplicateIdx: duplicateIdxGrp,
        errChoiceIdx: errChoiceIdx === indx ? null : errChoiceIdx,
        choiceEmptyErrMsg: "",
      });
    }
  };

  onAddChoice = () => {
    const { t } = this.props;
    const { pollChoices } = this.state;
    if (pollChoices.length === 6) {
      ToastsStore.warning(t("polls.choiceExceedMsg"), 2000);
    } else {
      pollChoices.push({
        text: "",
        placeHolder: "Enter Choice",
      });
      this.setState({
        pollChoices,
        selectedChoiceEle: "",
        selectedChoiceIndex: null,
      });
    }
  };

  onRemoveChoice = (indx) => {
    const { t } = this.props;
    const { pollChoices, duplicateIdx } = this.state;
    let duplicateIdxGrp = duplicateIdx;
    duplicateIdxGrp.includes(indx) &&
      duplicateIdxGrp.splice(
        duplicateIdxGrp.findIndex((item) => item == indx),
        1
      );
    if (pollChoices.length < 3) {
      ToastsStore.warning(t("polls.minimumOptionsValidationMsg"), 2000);
    } else {
      pollChoices.splice(indx, 1);
      this.setState({
        pollChoices: pollChoices,
        duplicateIdx: duplicateIdxGrp,
      });
    }
  };

  onCreatePoll = () => {
    const { t, closeModal } = this.props;
    const {
      pollChoices,
      pollTitle,
      singleChoiceSelected,
      endDate,
      categoryType,
      selectedMembers,
      selectedUnits,
    } = this.state;
    let valueArr = pollChoices.map((item) => item.text);
    let choiceIdx, emptyChoiceIdx;
    valueArr.map((item, idx) => {
      if (valueArr.indexOf(item) !== idx) {
        choiceIdx = idx;
      }
    });
    valueArr.map((item, idx) => {
      if (item.trim() == "") {
        emptyChoiceIdx = idx;
      }
    });
    let isChoiceEmpty = valueArr.some((item) => {
      return item.trim() === "";
    });
    let isDuplicate = valueArr.some(
      (item, idx) => valueArr.indexOf(item) != idx
    );
    if (!pollTitle) {
      this.setState({
        pollQuestionErrMsg: t("polls.poleTitleValidationMsg"),
      });
    } else if (isChoiceEmpty) {
      this.setState({
        choiceEmptyErrMsg: t("polls.pollChoiceValidationMsg"),
        errEmptyChoiceIdx: emptyChoiceIdx,
      });
    } else if (isDuplicate) {
      this.setState({
        choiceDuplicateErrMsg: t("polls.pollOptionsValidationMsg"),
      });
    } else if (
      selectedMembers.length == 0 &&
      selectedUnits.length == 0 &&
      categoryType !== "everyone"
    ) {
      ToastsStore.warning(t("polls.selectPollAudienceWarning"));
    } else {
      let arr = [];
      pollChoices.map((item) => {
        arr.push({
          Answer: item.text,
        });
      });
      let participants = [];
      let unitValParticipants = [];
      selectedMembers.map((mem) =>
        participants.push({ UserName: mem.UserName })
      );
      selectedUnits.map((unit) => unitValParticipants.push(unit.Id));
      let payload = {
        Question: pollTitle,
        Options: arr,
        AllowedVotes: singleChoiceSelected ? 1 : pollChoices.length,
        StartDate: UTCFormat(new Date()),
        EndDate: UTCFormat(endDate),
        GroupsId: [null],
        IsParticipant: categoryType == "everyone" ? false : true,
        Participants: participants.length > 0 ? participants : [],
        UnitValueParticipants:
          unitValParticipants.length > 0 ? unitValParticipants : [],
      };
      this.setState({ creating: true });
      new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .createPoll(payload)
        .then((res) => {
          ToastsStore.success(t("polls.pollSuccessMsg"), 2000);
          this.props.getPollData(1, 4);
          setTimeout(() => {
            closeModal();
            this.setState({ creating: false });
          }, 1500);
        })
        .catch((err) => {
          ErrorHandling(err);
          console.error(err);
          ToastsStore.error(t("quiz.internalErr"));
          this.setState({ creating: false });
        });
    }
  };
  handleOnDragEnd = (param) => {
    const { pollChoices } = this.state;
    const srcI = param.source.index;
    const desI = param.destination !== null && param.destination.index;
    if (desI !== undefined) {
      pollChoices.splice(desI, 0, pollChoices.splice(srcI, 1)[0]);
      this.setState({
        pollChoices: pollChoices,
        draggingState: false,
        draggingChoiceId: null,
      });
    }
  };

  onCloseModal = () => {
    this.setState({
      showCloseModal: true,
    });
  };

  checkStateChanged = () => {
    const { closeModal } = this.props;
    const {
      pollTitle,
      singleChoiceSelected,
      multiChoiceSelected,
      pollChoices,
      endDate,
    } = this.state;

    if (
      pollTitle !== "" ||
      !singleChoiceSelected ||
      multiChoiceSelected ||
      pollChoices.length !== 2 ||
      pollChoices[0].text !== "" ||
      pollChoices[1].text !== "" ||
      endDate.format("DD/MM/YYYY") !==
        moment(new Date(), "DD/MM/YYYY").add(1, "days").format("DD/MM/YYYY")
    ) {
      this.onCloseModal();
    } else {
      closeModal();
    }
  };

  onSelectMember = () => {
    this.setState({
      openSelectMembersPopup: true,
    });
  };

  onEditMember = () => {
    const { categoryType } = this.state;
    this.setState({
      openSelectMembersPopup: true,
      editMember: categoryType == "individuals" ? true : false,
      editGroup: categoryType == "groups" ? true : false,
    });
  };

  onCloseMemberModal = () => {
    this.setState({
      openSelectMembersPopup: false,
    });
  };

  onAddMembers = (type, members, units) => {
    this.setState({
      openSelectMembersPopup: false,
      categoryType: type,
      selectedMembers: members,
      selectedUnits: units,
      pollAudience:
        type == "everyone" ? [] : type == "groups" ? units : members,
      showAllTeamMembers: false,
    });
  };

  onClearMembers = () => {
    this.setState({
      selectedMembers: [],
      selectedUnits: [],
      pollAudience: [],
    });
  };

  removeSelected(item) {
    const { pollAudience, selectedMembers, selectedUnits } = this.state;
    if (item.type == "individuals") {
      let removeIndex = pollAudience
        .map((mem) => mem.UserName)
        .indexOf(item.UserName);
      pollAudience.splice(removeIndex, 1);
    } else {
      let removeIndex = pollAudience.map((unit) => unit.Id).indexOf(item.Id);
      pollAudience.splice(removeIndex, 1);
    }
    this.setState({ pollAudience, selectedMembers, selectedUnits });
  }

  showAllTeamMembersClick(e, show) {
    e.stopPropagation();
    this.setState({ showAllTeamMembers: show });
  }

  renderPollAudience() {
    const { t } = this.props;
    const remainingTeamMem = [];
    const { categoryType, pollAudience, showAllTeamMembers } = this.state;
    if (categoryType == "groups" || categoryType == "individuals") {
      if (pollAudience.length > 0) {
        return (
          <div>
            {showAllTeamMembers ? (
              <div style={{ maxHeight: 120, overflow: "scroll" }}>
                <div className="d-flex flex-wrap">
                  {pollAudience.map((item, indx) => {
                    return (
                      <>
                        <div
                          key={indx}
                          className="app-blue-badge-pill ml-2 py-2 my-1 bg-dark-gray text-black jobcriteria-badge-pill text-left"
                        >
                          <span className="text-small font-weight-bold text-gray">
                            {item.Name}
                          </span>
                          <i
                            className="fas fa-times fa-sm text-gray pl-2 pointer"
                            onClick={() => this.removeSelected(item)}
                          />
                        </div>
                      </>
                    );
                  })}
                </div>
                <div
                  className="position-absolute"
                  style={{ right: 16, bottom: 20 }}
                >
                  <i
                    onClick={(e) => this.showAllTeamMembersClick(e, false)}
                    className="fa fa-chevron-up p-2 ic_container pointer mr-2"
                  />
                </div>
              </div>
            ) : (
              <div className="d-flex flex-wrap">
                {pollAudience.map((item, indx) => {
                  if (indx < 4) {
                    return (
                      <div>
                        <div
                          key={indx}
                          className="app-blue-badge-pill ml-2 py-2 my-1 bg-dark-gray text-black jobcriteria-badge-pill text-left"
                        >
                          <span className="text-small font-weight-bold text-gray">
                            {item.Name}
                          </span>
                          <i
                            className="fas fa-times fa-sm text-gray pl-2 pointer"
                            onClick={() => this.removeSelected(item)}
                          />
                        </div>
                      </div>
                    );
                  } else {
                    remainingTeamMem.push(item);
                    return null;
                  }
                })}
                {remainingTeamMem.length > 0 && (
                  <div onClick={(e) => this.showAllTeamMembersClick(e, true)}>
                    <Avatar className="small avatar-class ml-2 mt-1 pointer">
                      {"+" + remainingTeamMem.length}
                    </Avatar>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      } else {
        return <p className="pl-3 small">{t("polls.selectPollAudience")}</p>;
      }
    } else if (categoryType == "everyone") {
      return <p className="pl-3 small">{t("common.everyone")}</p>;
    } else {
      return <p className="pl-3 small">{t("polls.selectPollAudience")}</p>;
    }
  }

  render() {
    const { show, closeModal, t } = this.props;
    const {
      pollTitle,
      pollChoices,
      singleChoiceSelected,
      openSelectMembersPopup,
      editMember,
      editGroup,
      selectedMembers,
      selectedUnits,
      categoryType,
      pollAudience,
      multiChoiceSelected,
      pollQuestionSelected,
      duplicateIdx,
      selectedChoiceIndex,
      selectedChoiceEle,
      endDate,
      pollQuestionErrMsg,
      choiceEmptyErrMsg,
      choiceDuplicateErrMsg,
      errChoiceIdx,
      errEmptyChoiceIdx,
      draggingState,
      draggingChoiceIdx,
      showCloseModal,
    } = this.state;

    if (showCloseModal) {
      return (
        <ConfirmPopup
          fromPages={true}
          message={t("common.warning")}
          onHide={() => this.setState({ showCloseModal: false })}
          confirmClick={() => {
            closeModal();
            $("#myModal").modal("hide");
          }}
        />
      );
    }

    if (openSelectMembersPopup) {
      return (
        <SelectMemberModal
          show={openSelectMembersPopup}
          onClose={this.onCloseMemberModal}
          header={t("polls.selectRespondents")}
          loading={false}
          showDropdownContainer={true}
          multipleUsers={true}
          btnText={t("common.add")}
          onSubmit={this.onAddMembers}
          onClearMembers={this.onClearMembers}
          popupType="poll"
          submitting={false}
          isEditMember={editMember}
          isEditGroup={editGroup}
          editMembers={selectedMembers}
          editUnits={selectedUnits}
        />
      );
    }
    return (
      <Modal
        show={show}
        onHide={this.checkStateChanged}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        dialogClassName="setting_modal p-3"
        animation={false}
        centered
      >
        <ToastsContainer
          store={ToastsStore}
          position={ToastsContainerPosition.TOP_RIGHT}
        />
        <Modal.Body
          className="bg-gray p-lg-4 p-md-4 p-3"
          style={{ borderRadius: "8px" }}
        >
          <div className="d-flex">
            <h4 className="font-weight-bold pl-2">{t("polls.newPoll")}</h4>
            <i
              className="fas fa-times fa-lg text-gray position-absolute pointer"
              onClick={this.checkStateChanged}
              style={{ right: "30px" }}
            ></i>
          </div>
          <div className="mt-2 container p-2">
            <div className="col-md-12">
              <div className="form-group">
                <label
                  htmlFor="title"
                  className="normal font-weight-bold"
                  style={{ color: "#666" }}
                >
                  {t("polls.pollTitle")}
                </label>
                <input
                  type="text"
                  className="form-control form-control-md normal input-field poll_border"
                  id="pollTitle"
                  name="pollTitle"
                  autoComplete="off"
                  ref={this.questionInput}
                  onClick={(e) =>
                    this.setState({
                      pollTitle: this.state.pollTitle,
                      pollQuestionSelected: true,
                    })
                  }
                  placeholder={t("polls.enterPollQuestion")}
                  maxLength={250}
                  onChange={this.handleChange}
                  value={this.state.pollTitle}
                />
                {pollQuestionErrMsg && (
                  <small>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-exclamation-circle text-danger" />
                      <p className="text-danger ml-1">{pollQuestionErrMsg}</p>
                    </div>
                  </small>
                )}
                <p
                  className="float-right"
                  style={{ color: "#666", height: "15px" }}
                >
                  <div className="row">
                    {pollQuestionSelected && (
                      <div>
                        <small>
                          {pollTitle.length} / {maxDescCount}
                        </small>
                      </div>
                    )}
                  </div>
                </p>
              </div>
            </div>
            <div className="d-flex">
              <div className="form-group col-md-6 pt-4">
                <label
                  htmlFor="remindUsersBy"
                  className="normal font-weight-bold"
                  style={{ color: "#666" }}
                >
                  {t("polls.addChoices")}
                </label>
              </div>
              <div className="form-group col-md-6 pt-4 d-flex justify-content-around">
                <div
                  className="d-flex pointer"
                  onClick={() => {
                    this.setState({
                      singleChoiceSelected: true,
                      multiChoiceSelected: false,
                    });
                  }}
                >
                  {singleChoiceSelected ? (
                    <div className="circle-primary mr-1 mt-1" />
                  ) : (
                    <div className="circle-gray mr-1 mt-1" />
                  )}
                  <label
                    htmlFor="singleChoice"
                    className={
                      singleChoiceSelected
                        ? "normal font-weight-bold ml-2 pointer text-primary"
                        : "normal font-weight-bold ml-2 pointer text-gray"
                    }
                  >
                    {t("polls.singleChoice")}
                  </label>
                </div>
                <div
                  className="d-flex pointer"
                  onClick={() => {
                    this.setState({
                      multiChoiceSelected: true,
                      singleChoiceSelected: false,
                    });
                  }}
                >
                  {singleChoiceSelected ? (
                    <div className="circle-gray mr-1 mt-1" />
                  ) : (
                    <div className="circle-primary mr-1 mt-1" />
                  )}
                  <label
                    htmlFor="multipleChoice"
                    className={
                      singleChoiceSelected
                        ? "normal font-weight-bold ml-2 pointer text-gray"
                        : "normal font-weight-bold ml-2 pointer text-primary"
                    }
                  >
                    {t("polls.multipleChoice")}
                  </label>
                </div>
              </div>
            </div>
            <DragDropContext
              onDragStart={(param) => {
                this.setState({
                  draggingState: true,
                  draggingChoiceIdx: param.source.index,
                });
              }}
              onDragEnd={this.handleOnDragEnd}
            >
              <Droppable droppableId="droppable-1">
                {(provided) => (
                  <div
                    className="form-group col-md-12"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {pollChoices.map((choice, indx) => {
                      return (
                        <Draggable
                          key={indx}
                          draggableId={"draggable-" + indx}
                          index={indx}
                        >
                          {(provided) => (
                            <div>
                              <div
                                className="d-flex align-items-center pt-2"
                                {...provided.draggableProps}
                                ref={provided.innerRef}
                              >
                                <i
                                  className="fas fa-arrows-alt-v"
                                  {...provided.dragHandleProps}
                                  style={
                                    draggingState && draggingChoiceIdx == indx
                                      ? { color: "#0062ff", marginRight: 10 }
                                      : { color: "#888", marginRight: 10 }
                                  }
                                  data-toggle="tooltip"
                                  data-placement="top"
                                  title={t("polls.dragTooltip")}
                                />
                                {this.state.singleChoiceSelected ? (
                                  <input
                                    type="radio"
                                    style={{ left: "35px" }}
                                    className="position-relative disabled-group"
                                    id={indx}
                                  />
                                ) : (
                                  <input
                                    className="position-relative disabled-group"
                                    style={{ left: "35px" }}
                                    type="checkbox"
                                  />
                                )}
                                <input
                                  type="text"
                                  style={
                                    choiceDuplicateErrMsg &&
                                    duplicateIdx.includes(indx)
                                      ? {
                                          border: "2px solid",
                                          boxShadow: "none",
                                        }
                                      : { boxShadow: "none" }
                                  }
                                  className={
                                    choiceDuplicateErrMsg &&
                                    duplicateIdx.includes(indx)
                                      ? "form-control bg-white form-control-md normal input-field border-danger pl-5 pr-5"
                                      : "form-control poll_border form-control-md normal bg-white input-field pl-5 pr-5"
                                  }
                                  id="pollChoice"
                                  name="pollChoice"
                                  autoComplete="off"
                                  ref={this.choiceInput}
                                  placeholder={choice.placeHolder}
                                  maxLength={75}
                                  onClick={(e) => {
                                    this.setState({
                                      selectedChoiceEle: choice.text,
                                      selectedChoiceIndex: indx,
                                    });
                                  }}
                                  onMouseDown={() =>
                                    this.setState({
                                      selectedChoiceEle: choice.text,
                                      selectedChoiceIndex: indx,
                                    })
                                  }
                                  onChange={(evt) =>
                                    this.handleChoiceChange(evt, indx)
                                  }
                                  value={choice.text}
                                />
                                {!(indx == 1 || indx == 0) && (
                                  <i
                                    className="far fa-times-circle text-gray pointer fa-lg position-absolute pointer"
                                    onClick={() => {
                                      this.onRemoveChoice(indx);
                                    }}
                                    style={{ right: "30px" }}
                                  ></i>
                                )}
                              </div>
                              <div className="row">
                                <div className="col-md-6">
                                  {choiceDuplicateErrMsg &&
                                    duplicateIdx.includes(indx) && (
                                      <small>
                                        <div
                                          className="d-flex align-items-center"
                                          style={{ marginLeft: 30 }}
                                        >
                                          <i className="fas fa-exclamation-circle text-danger" />
                                          <p className="text-danger ml-1">
                                            {choiceDuplicateErrMsg}
                                          </p>
                                        </div>
                                      </small>
                                    )}
                                  {choiceEmptyErrMsg &&
                                    errEmptyChoiceIdx == indx && (
                                      <small>
                                        <div
                                          className="d-flex align-items-center"
                                          style={{ marginLeft: 30 }}
                                        >
                                          <i className="fas fa-exclamation-circle text-danger" />
                                          <p className="text-danger ml-1">
                                            {choiceEmptyErrMsg}
                                          </p>
                                        </div>
                                      </small>
                                    )}
                                  {indx == pollChoices.length - 1 && (
                                    <div className="pl-4">
                                      <small className="text-gray ml-2">
                                        {t("polls.maxSixChoices")}
                                      </small>
                                    </div>
                                  )}
                                </div>

                                {selectedChoiceIndex == indx && (
                                  <div className="col-md-6">
                                    <small
                                      className="float-right"
                                      style={{ color: "#666" }}
                                    >
                                      {selectedChoiceEle.length} /{" "}
                                      {maxChoiceCount}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="col-md-12 d-flex flex-row-reverse justify-content-between">
              <button
                className={
                  pollChoices.length > 5
                    ? "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal"
                    : "py-2 app-blue-badge-pill blue-thick-border btn-border-radius normal"
                }
                onClick={this.onAddChoice}
                disabled={pollChoices.length > 5 ? true : false}
                style={{ lineHeight: "unset" }}
              >
                <span
                  className={
                    pollChoices.length > 5 ? "text-gray" : "text-primary"
                  }
                >
                  {t("common.add")}
                </span>
                <i
                  className={
                    pollChoices.length > 5
                      ? "fa fa-plus fa-lg ml-3 text-gray"
                      : "fa fa-plus fa-lg ml-3 text-primary"
                  }
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            <div className="col-md-12">
              <div className="form-group">
                <label
                  htmlFor="title"
                  className="normal font-weight-bold"
                  style={{ color: "#666" }}
                >
                  {t("polls.selectRespondents")}
                </label>
                <div className="border border-light bg-white py-3 rounded">
                  <div className="d-flex align-items-center">
                    {!pollAudience.length > 0 && (
                      <span className="pl-3">
                        <i
                          className={
                            categoryType == "everyone"
                              ? "fas fa-user-friends text-primary p-2 sel_ic_container"
                              : "fas fa-user-friends text-gray p-2 ic_container"
                          }
                        />
                      </span>
                    )}
                    {this.renderPollAudience()}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-12 d-flex flex-row-reverse">
              {pollAudience.length > 0 || categoryType == "everyone" ? (
                <button
                  className={
                    "py-2 app-blue-badge-pill blue-thick-border btn-border-radius normal"
                  }
                  onClick={this.onEditMember}
                  disabled={false}
                  style={{ lineHeight: "unset", width: 100 }}
                >
                  <span className={"text-primary"}>{t("common.edit")}</span>
                </button>
              ) : (
                <button
                  className={
                    "py-2 app-blue-badge-pill blue-thick-border btn-border-radius normal"
                  }
                  onClick={this.onSelectMember}
                  disabled={false}
                  style={{ lineHeight: "unset", width: 100 }}
                >
                  <span className={"text-primary"}>{t("common.add")}</span>
                  <i
                    className={"fa fa-plus fa-lg ml-3 text-primary"}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>

            <div className="col-md-6 pt-2">
              <div className="d-flex flex-column">
                <div>
                  <label
                    htmlFor="remindUsersBy"
                    className="normal font-weight-bold"
                    style={{ color: "#666" }}
                  >
                    {t("polls.pollCloseOn")}
                  </label>
                  <span
                    className="small text-gray pl-1 pointer"
                    data-toggle="tooltip"
                    data-placement="top"
                    title={t("polls.closingPollTooltip")}
                  >
                    {"(?)"}
                  </span>
                </div>
                <FilledDatePicker
                  disablePast={true}
                  value={endDate}
                  onChange={(date) => this.setState({ endDate: date })}
                  className="MuiOutlinedInput-input bg-white"
                  minDate={moment(new Date(), "DD/MM/YYYY").add(1, "days")}
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          className="pr-4 pb-2"
          style={{ border: "0px", backgroundColor: "#F9F9F9" }}
        >
          <Button
            onClick={this.onCreatePoll}
            size="sm"
            disabled={this.state.creating}
          >
            {t("polls.publishPoll")}
            {this.state.creating && (
              <span>
                &nbsp;<i className="fa fa-spinner fa-spin"></i>
              </span>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default withTranslation("translation")(CreatePoll);
