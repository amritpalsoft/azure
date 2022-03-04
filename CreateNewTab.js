/* eslint-disable no-lone-blocks */
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { withTranslation } from "react-i18next";
import "./surveyStyles.scss";
import { Button } from "react-bootstrap";
import Select from "react-select";
import InfiniteScroll from "react-infinite-scroller";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Api } from "../../api/Api";
import GetAPIHeader from "../../api/ApiCaller";
import {
  ToastsContainer,
  ToastsContainerPosition,
  ToastsStore,
} from "react-toasts";
import { TruncateWithDynamicLen } from "../../constants/constants";
import StarRatings from "react-star-ratings";
import Loading from "../../components/Loading/loading";
import Modal from "react-bootstrap/Modal";
import BadgeWithAvatarCount from "../../components/BadgeWithAvatharCount/BadgeWithAvatharCount";
import ImageUtils from "../../components/Utils/ImageUtils/ImageUtils";
import Avatar from "@material-ui/core/Avatar";
import ReviewerCloseIcon from "../../assets/images/reviewerCloseIcon.svg";
import FilledDatePicker from "../../components/FilledDatePicker/FilledDatePicker";
import FilledTimePicker from "../../components/FilledTimePicker/FilledTimePicker";
import CreateQuestionsBlank from "../../assets/images/CreateQuestionsBlank.svg";
import AddMembers from "../../assets/images/AddMembers.svg";
import { DateFormatter, TimeFormat } from "../../constants/constants";
import ConfirmPopup from "../../components/Modal/LogoutDialog";
import $ from "jquery";
import moment from "moment";
import StorageUtils from "../../containers/utils/StorageUtils";

const Storage = new StorageUtils();
const maxChoiceCount = 75;
const maxCount = 25;
const customStyles = {
  control: (provided) => ({
    ...provided,
    fontSize: 14,
  }),
};
class CreateNewTab extends Component {
  constructor(props) {
    super(props);
    this.choiceInput = React.createRef();
    this.state = {
      dayError: false,
      creating: false,
      surveyTitle: "",
      category: "",
      description: "",
      isAnonymous: true,
      surveyScreen: true,
      addMemScreen: false,
      publishScreen: false,
      selectedChoiceEle: "",
      pollQuestionErrMsg: "",
      choiceDuplicateErrMsg: "",
      choiceEmptyErrMsg: "",
      selectedChoiceIndex: null,
      pollQuestionSelected: false,
      showCloseModal: false,
      duplicateIdx: [],
      teamMembersList: [],
      loading: 0,
      modalLoading: 1,
      showTeamMemberModal: false,
      selectedTeamMembers: [],
      addedTeamMembers: [],
      dummyAddedUsers: [],
      showAllTeamMembers: false,
      questionError: true,
      disbalingAddNextQsn: false,
      ratingErr: true,
      selectedAll: false,
      date: moment(new Date(), "DD/MM/YYYY").add(1, "days"),
      time: new Date(),
      businessUnitVals: [],
      selectedBUs: [],
      surveyTitleSelected: false,
      descriptionSelected: false,
      hasMore: true,
      pageNumber: 1,
      pageSize: 50,
      userSearchTerm: "",
      filteredUnitValues: [],
      activeQsnIndex: 0,
      // enableTime: 'true',
      task: [
        { event: "First data", eventpara: "First Data" },
        { event: "Second data", eventpara: "Second Data" },
        { event: "Third data", eventpara: "Third Data" },
      ],
      guid: "",
      questionsArr: [
        {
          addQuestion: "Add Question",
          options: [
            { value: "Text Box", label: "Text Box" },
            { value: "Select List", label: "Select List" },
            { value: "Rating", label: "Rating" },
            { value: "Date", label: "Date" },
          ],
          placeHolder: "Type an Open Question",
          question: "",
          questionLen: 0,
          maxTen: "Maximum 10 Choices",
          questionType: "questionsimple",
          simple: { regName: "None" },
          selectedQsnType: { value: "Text Box", label: "Text Box" },
          multipleChoice: {
            isMultipleSelection: false,
            isRanking: false,
            values: [
              {
                text: "",
                placeHolder: "Enter Choice",
                draggableId: "draggable-0",
                multiChoiceError: false,
              },
              {
                text: "",
                placeHolder: "Enter Choice",
                draggableId: "draggable-1",
                multiChoiceError: false,
              },
            ],
          },
          ratingType: "Star",
          rating: {
            RatingType: 1,
            Ratingvalue: "",
            order: 1,
            MinValue: "",
            MaxValue: "",
          },
          order: 1,
        },
      ],
    };
  }
  componentDidMount() {
    const { surveyScreen, addMemScreen, publishScreen } = this.state;
    const { prePopulateData, getProgress } = this.props;
    console.log("prepopulateData", prePopulateData);
    getProgress(surveyScreen, addMemScreen, publishScreen);
    {
      surveyScreen &&
        document.addEventListener("mousedown", this.handleClickOutside, true);
    }
    if (prePopulateData) {
      var category = {
        value: prePopulateData.templateCategoryDesc,
        label: prePopulateData.templateCategoryDesc,
        sguid: prePopulateData.templateCategorySguid,
      };
      var questionsArr = [];
      var questionRating;
      var questionmultichoice;
      var qsnsDataFromAPI = prePopulateData.sections[0].questions;
      qsnsDataFromAPI &&
        qsnsDataFromAPI.length > 0 &&
        qsnsDataFromAPI.map((eachQsn) => {
          if (eachQsn.questionType == "questionrating") {
            questionRating = true;
          } else {
            questionRating = false;
          }
          if (eachQsn.questionType == "questionmultichoice") {
            questionmultichoice = true;
          } else {
            questionmultichoice = false;
          }
          eachQsn.multipleChoice !== null &&
            eachQsn.multipleChoice.values.map((eachVal, idx) => {
              eachVal.text = eachVal.value;
              eachVal.draggableId = "draggable-" + idx;
            });
          eachQsn.addQuestion = "Add Question";
          eachQsn.options = [
            { value: "Text Box", label: "Text Box" },
            { value: "Select List", label: "Select List" },
            { value: "Rating", label: "Rating" },
            { value: "Date", label: "Date" },
          ];

          eachQsn.selectedQsnType =
            eachQsn.questionType === "questionsimple"
              ? eachQsn.simple.regName === "Date"
                ? { value: "Date", label: "Date" }
                : { value: "Text Box", label: "Text Box" }
              : eachQsn.questionType === "questionmultichoice"
              ? { value: "Select List", label: "Select List" }
              : { value: "Rating", label: "Rating" };
          eachQsn.placeHolder = "Type an Open Question";
          eachQsn.question = eachQsn.questionText;
          eachQsn.questionLen = eachQsn.questionText.length;
          eachQsn.maxTen = "Maximum 10 Choices";
          eachQsn.questionType = eachQsn.questionType;
          eachQsn.simple =
            eachQsn.simple && eachQsn.simple.regName == "Date"
              ? { regName: "Date" }
              : { regName: "None" };
          eachQsn.multipleChoice =
            eachQsn.multipleChoice === null
              ? {
                  isMultipleSelection: false,
                  isRanking: false,
                  values: [
                    {
                      text: "",
                      placeHolder: "Enter Choice",
                      draggableId: "draggable-0",
                      multiChoiceError: false,
                    },
                    {
                      text: "",
                      placeHolder: "Enter Choice",
                      draggableId: "draggable-1",
                      multiChoiceError: false,
                    },
                  ],
                }
              : eachQsn.multipleChoice;
          eachQsn.ratingType = eachQsn.ratingType;
          eachQsn.rating =
            eachQsn.rating === null
              ? {
                  RatingType: 1,
                  Ratingvalue: "",
                  order: 1,
                  MinValue: "",
                  MaxValue: "",
                }
              : eachQsn.rating;
          eachQsn.showRating = questionRating;
          eachQsn.showSelectList = questionmultichoice;
          eachQsn.showDate = eachQsn.simple.regName === "Date" ? true : false;
          eachQsn.order = eachQsn.order;
          questionsArr.push(eachQsn);
        });
      console.log("questionArr", questionsArr);
      this.setState({
        surveyTitle: prePopulateData.surveyTitle,
        description: prePopulateData.surveyDescription,
        category: category,
        questionsArr: questionsArr,
        questionError: false,
        isAnonymous: prePopulateData.isAnonymous,
      });
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside, true);
  }

  handleClickOutside = (event) => {
    const { activeQsnIndex, duplicateIdx, questionsArr } = this.state;
    let duplicateIdxGrp = duplicateIdx;
    var choicesArr = questionsArr[activeQsnIndex].multipleChoice.values;
    let selIdx = duplicateIdxGrp && duplicateIdxGrp[0];
    if (duplicateIdxGrp.length) {
      duplicateIdxGrp.splice(
        duplicateIdxGrp.findIndex((item) => item == selIdx),
        1
      );
      choicesArr[selIdx].text = "";
      this.setState({
        duplicateIdx: duplicateIdxGrp,
        questionsArr: questionsArr,
      });
    }
    this.setState({
      surveyTitleSelected: false,
      descriptionSelected: false,
      selectedQuestionIndex: "",
    });
    if (
      (event.target && event.target.id) !==
      (this.choiceInput.current && this.choiceInput.current.id)
    ) {
      this.setState({ selectedChoiceIndex: null });
    }
  };
  //---Click and Change Events---
  onAddQuestion = () => {
    const { t } = this.props;
    const { questionsArr, questionError, disbalingAddNextQsn } = this.state;
    questionsArr.length > 0 &&
      questionsArr.map((eachQsn, index) => {
        if (eachQsn.question === "") {
          questionsArr[index].qsnEmptyErr = true;
          this.setState({
            questionsArr,
            questionError: true,
            disbalingAddNextQsn: true,
          });
        } else {
          questionsArr[index].qsnEmptyErr = false;
          this.setState({
            questionsArr,
            questionError: !questionError,
            disbalingAddNextQsn: !disbalingAddNextQsn,
          });
        }
        if (eachQsn.minValRating === "") {
          questionsArr[index].minValRatingEmptyErr = true;
        } else {
          questionsArr[index].minValRatingEmptyErr = false;
        }
        if (eachQsn.maxValRating === "") {
          questionsArr[index].maxValRatingEmptyErr = true;
        } else {
          questionsArr[index].maxValRatingEmptyErr = false;
        }
        if (eachQsn.minValSlider === "") {
          questionsArr[index].minValSliderEmptyErr = true;
        } else {
          questionsArr[index].minValSliderEmptyErr = false;
        }
        if (eachQsn.maxValSlider === "") {
          questionsArr[index].maxValSliderEmptyErr = true;
        } else {
          questionsArr[index].maxValSliderEmptyErr = false;
        }
      });
    if (!questionError) {
      if (questionsArr.length === 10) {
        ToastsStore.warning(t("survey.qsnsExceedMsg"), 2000);
        this.setState({ disbalingAddNextQsn: true });
      } else {
        questionsArr.push({
          addQuestion: "Add Question",
          options: [
            { value: "Text Box", label: "Text Box" },
            { value: "Select List", label: "Select List" },
            { value: "Rating", label: "Rating" },
            { value: "Date", label: "Date" },
          ],
          placeHolder: "Type an Open Question",
          question: "",
          questionLen: 0,
          maxTen: "Maximum 10 Choices",
          questionType: "questionsimple",
          simple: { regName: "None" },
          multipleChoice: {
            isMultipleSelection: false,
            isRanking: false,
            values: [
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
          },
          ratingType: "Star",
          rating: {
            RatingType: 1,
            Ratingvalue: "",
            order: 1,
            MinValue: "",
            MaxValue: "",
          },
          order: questionsArr.length + 1,
        });
        if (questionsArr.length === 10) {
          this.setState({
            questionsArr,
            activeQsnIndex: questionsArr.length - 1,
            disbalingAddNextQsn: true,
          });
        } else {
          this.setState({
            questionsArr,
            activeQsnIndex: questionsArr.length - 1,
            disbalingAddNextQsn: false,
          });
        }
      }
    }
  };
  handleChangeQsn = (evt, index, type) => {
    const { questionsArr } = this.state;
    if (type === "question") {
      questionsArr[index].question = evt.target.value;
      questionsArr[index].questionLen = evt.target.value.length;
      if (questionsArr[index].question !== "") {
        questionsArr[index].qsnEmptyErr = false;
        if (questionsArr.length === 10) {
          this.setState({ questionError: false, disbalingAddNextQsn: true });
        } else {
          this.setState({ questionError: false, disbalingAddNextQsn: false });
        }
      } else {
        questionsArr[index].qsnEmptyErr = true;
        this.setState({ questionError: true, disbalingAddNextQsn: true });
      }
    } else if (type === "minrating") {
      questionsArr[index].rating.MinValue = evt.target.value;
      questionsArr[index].rating.minValError = false;
    } else if (type === "maxrating") {
      questionsArr[index].rating.MaxValue = evt.target.value;
      questionsArr[index].rating.maxValError = false;
    } else if (type === "minslider") {
      questionsArr[index].rating.MinValue = evt.target.value;
      questionsArr[index].rating.minValError = false;
    } else if (type === "maxslider") {
      questionsArr[index].rating.MaxValue = evt.target.value;
      questionsArr[index].rating.maxValError = false;
    }
    this.setState({ questionsArr });
  };
  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };
  handleOnDragEnd = (param, qsnIndex) => {
    const { questionsArr } = this.state;
    var choicesArr = questionsArr[qsnIndex].multipleChoice.values;
    const srcI = param.source.index;
    const desI = param.destination !== null && param.destination.index;
    this.setState({ activeQsnIndex: qsnIndex });
    if (desI !== undefined) {
      choicesArr.splice(desI, 0, choicesArr.splice(srcI, 1)[0]);
      this.setState({
        questionsArr: questionsArr,
        draggingState: false,
        draggingChoiceId: null,
      });
    }
  };
  handleChoiceChange = (evt, indx, qsnIndex) => {
    const { t } = this.props;
    const { errChoiceIdx, choiceDuplicateErrMsg, questionsArr } = this.state;
    this.setState({ activeQsnIndex: qsnIndex });
    var choicesArr = questionsArr[qsnIndex].multipleChoice.values;
    let duplicateIdxGrp = this.state.duplicateIdx;
    let isDuplicate = choicesArr.some((item, idx) => {
      if (evt.target.value.trim() === "") {
        return false;
      } else if (item.text === evt.target.value) {
        return true;
      }
    });
    choicesArr.map((item) => {
      if (evt.target.value.trim() !== "" && item.text == evt.target.value) {
        if (!duplicateIdxGrp.includes(indx)) {
          duplicateIdxGrp.push(indx);
        }
      }
    });
    if (isDuplicate) {
      choicesArr[indx].text = evt.target.value;
      choicesArr[indx].draggableId = "draggable-" + indx;
      this.setState({
        choiceDuplicateErrMsg: t("polls.pollOptionsValidationMsg"),
        errChoiceIdx: indx,
        duplicateIdx: duplicateIdxGrp,
        questionsArr: questionsArr,
        selectedChoiceEle: choicesArr[indx].text,
      });
    } else {
      duplicateIdxGrp.includes(indx) &&
        duplicateIdxGrp.splice(
          duplicateIdxGrp.findIndex((item) => item == indx),
          1
        );
      choicesArr[indx].text = evt.target.value;
      choicesArr[indx].draggableId = "draggable-" + indx;
      if (evt.target.value === "") {
        choicesArr[indx].multiChoiceError = true;
      } else {
        choicesArr[indx].multiChoiceError = false;
      }
      this.setState({
        questionsArr: questionsArr,
        selectedChoiceEle: choicesArr[indx].text,
        choiceDuplicateErrMsg: duplicateIdxGrp.length
          ? choiceDuplicateErrMsg
          : "",
        duplicateIdx: duplicateIdxGrp,
        errChoiceIdx: errChoiceIdx === indx ? null : errChoiceIdx,
        choiceEmptyErrMsg: "",
      });
    }
  };
  onAddChoice = (qsnIndex) => {
    document.removeEventListener("mousemove", this.handleClickOutside);
    const { t, prePopulateData } = this.props;
    const { questionsArr } = this.state;
    var choicesArr = questionsArr[qsnIndex].multipleChoice.values;
    if (choicesArr.length == 6) {
      ToastsStore.warning(t("polls.choiceExceedMsg"), 2000);
    } else {
      choicesArr.push({
        text: "",
        placeHolder: "Enter Choice",
      });
      this.setState({
        questionsArr: questionsArr,
        selectedChoiceEle: "",
        selectedChoiceIndex: null,
      });
    }
  };
  handleBack = () => {
    const { addMemScreen, publishScreen } = this.state;
    if (addMemScreen) {
      document.addEventListener("mousedown", this.handleClickOutside);
      this.setState({
        addMemScreen: false,
        surveyScreen: true,
        publishScreen: false,
      });
      this.props.getProgress(true, false, false);
    }
    if (publishScreen) {
      this.setState({
        addMemScreen: true,
        surveyScreen: false,
        publishScreen: false,
      });
      this.props.getProgress(true, true, false);
    }
  };
  onRemoveChoice = (indx, qsnIndex) => {
    const { t } = this.props;
    const { duplicateIdx, questionsArr } = this.state;
    var choicesArr = questionsArr[qsnIndex].multipleChoice.values;
    let duplicateIdxGrp = duplicateIdx;
    duplicateIdxGrp.includes(indx) &&
      duplicateIdxGrp.splice(
        duplicateIdxGrp.findIndex((item) => item == indx),
        1
      );
    if (choicesArr.length < 3) {
      ToastsStore.warning(t("polls.minimumOptionsValidationMsg"), 2000);
    } else {
      choicesArr.splice(indx, 1);
      this.setState({
        questionsArr: questionsArr,
        duplicateIdx: duplicateIdxGrp,
      });
    }
  };
  onRemoveUser = (userId) => {
    const { selectedTeamMembers, teamMembersList } = this.state;
    let removeIndex = selectedTeamMembers
      .map((item) => item.UserId)
      .indexOf(userId);
    selectedTeamMembers.splice(removeIndex, 1);
    teamMembersList.length > 0 &&
      teamMembersList.map((eachTeamMem) => {
        if (eachTeamMem.UserId === userId) {
          eachTeamMem.selected = false;
        }
      });
    if (selectedTeamMembers.length < 2) {
      this.setState({ showAllTeamMembers: false });
    }
    this.setState({ selectedTeamMembers, teamMembersList });
  };
  onRemoveQsn = (index) => {
    const { questionsArr } = this.state;
    var qsnIndexVar = questionsArr[index];
    if (
      (qsnIndexVar.selectedQsnType !== "" &&
        qsnIndexVar.selectedQsnType !== undefined) ||
      qsnIndexVar.question !== ""
    ) {
      this.setState({ showCloseModal: true, removeQsnIdx: index });
    } else {
      questionsArr.splice(index, 1);
      this.setState({ questionError: false, disbalingAddNextQsn: false });
    }
    this.setState({ questionsArr, activeQsnIndex: questionsArr.length - 1 });
  };
  onSearchUser = (evt) => {
    const { pageNumber, pageSize, userSearchTerm, selectedTeamMembers } =
      this.state;
    let inputKeyCode = evt.keyCode ? evt.keyCode : evt.which;
    if (inputKeyCode != null) {
      if (inputKeyCode === 13) {
        this.setState(
          { selectedAll: false },
          this.getOrgUsers.bind(this, 1, pageSize, "search")
        );
      }
    }
  };
  onFilterUser = (evt) => {
    const { pageNumber, pageSize, filteredUnitValues } = this.state;
    if (evt.target.checked) {
      filteredUnitValues.push(evt.target.value);
      this.setState(
        {
          filteredUnitValues: filteredUnitValues,
        },
        this.getOrgUsers.bind(this, pageNumber, pageSize, "filter")
      );
    } else {
      filteredUnitValues.splice(
        filteredUnitValues.findIndex((el) => el === evt.target.value),
        1
      );
      this.setState(
        {
          filteredUnitValues: filteredUnitValues,
        },
        this.getOrgUsers.bind(this, pageNumber, pageSize, "filter")
      );
    }
  };
  closeWarningPopup = () => {
    const {
      questionsArr,
      removeQsnIdx,
      dummyAddedUsers,
      surveyScreen,
      teamMembersList,
    } = this.state;
    $("#myModal").modal("hide");
    if (surveyScreen && removeQsnIdx) {
      questionsArr.splice(removeQsnIdx, 1);
      this.setState({
        activeQsnIndex: questionsArr.length - 1,
        questionError: false,
        disbalingAddNextQsn: false,
      });
    } else {
      teamMembersList.length > 0 &&
        teamMembersList.map((eachTeamMem) => {
          dummyAddedUsers.length > 0 &&
            dummyAddedUsers.map((extraUser) => {
              if (eachTeamMem.UserId === extraUser.UserId) {
                eachTeamMem.selected = false;
              }
            });
        });

      teamMembersList.length > 0 &&
        teamMembersList.map((eachTeamMem) => {
          this.state.selectedTeamMembers &&
            this.state.selectedTeamMembers.length > 0 &&
            this.state.selectedTeamMembers.map((selectedMembers) => {
              if (eachTeamMem.UserId === selectedMembers.UserId) {
                eachTeamMem.selected = false;
              }
            });
        });
      this.setState({
        showTeamMemberModal: false,
        showCloseModal: false,
        addMemScreen: true,
        teamMembersList: teamMembersList,
        addedTeamMembers: [],
        dummyAddedUsers: [],
        selectedTeamMembers: [],
        selectedAll: false,
      });
    }
    this.setState({ showCloseModal: false, questionsArr: questionsArr });
  };
  addMembers = () => {
    document.removeEventListener("mousedown", this.handleClickOutside);
    const { publishScreen, questionsArr } = this.state;
    let ratingErr = false;
    let choicesErr = false;
    questionsArr.length > 0 &&
      questionsArr.map((eachQsn) => {
        if (eachQsn.questionType === "questionmultichoice") {
          var choices = [];
          eachQsn.multipleChoice.values.length > 0 &&
            eachQsn.multipleChoice.values.map((eachChoice, choiceIdx) => {
              if (eachChoice.text !== "") {
                choicesErr = false;
                eachChoice.multiChoiceError = false;
                var obj = { value: eachChoice.text, order: choiceIdx + 1 };
                choices.push(obj);
                this.setState({ questionsArr: questionsArr });
              } else {
                choicesErr = true;
                eachChoice.multiChoiceError = true;
                this.setState({ questionsArr: questionsArr });
              }
            });
        } else if (
          eachQsn.questionType === "questionrating" &&
          eachQsn.rating.RatingType !== 2
        ) {
          if (
            eachQsn.rating.MinValue === "" ||
            eachQsn.rating.MaxValue === ""
          ) {
            ratingErr = true;
            if (eachQsn.rating.MinValue === "") {
              eachQsn.rating.minValError = true;
            } else {
              eachQsn.rating.minValError = false;
            }
            if (eachQsn.rating.MaxValue === "") {
              eachQsn.rating.maxValError = true;
            } else {
              eachQsn.rating.maxValError = false;
            }
          }
        }
        this.setState({ questionsArr: questionsArr });
      });
    if (!ratingErr && !choicesErr) {
      this.setState({
        addMemScreen: true,
        surveyScreen: false,
        publishScreen: false,
      });
      this.props.getProgress(true, true, publishScreen);
    }
  };
  showAllTeamMembersClick(e, show) {
    e.stopPropagation();
    this.setState({ showAllTeamMembers: show });
  }
  isAnonymousClick(e) {
    this.setState({ isAnonymous: e.target.checked });
  }
  selecteAllTeamMembers(e) {
    const { teamMembersList, selectedTeamMembers } = this.state;
    teamMembersList.length > 0 &&
      teamMembersList.map((eachTeamMem) => {
        if (e.target.checked === true) {
          eachTeamMem.selected = true;
          selectedTeamMembers.push(eachTeamMem);
          const uniqueArray = selectedTeamMembers.filter((thing, index) => {
            const _thing = JSON.stringify(thing);
            return (
              index ===
              selectedTeamMembers.findIndex((obj) => {
                return JSON.stringify(obj) === _thing;
              })
            );
          });
          this.setState({
            selectedAll: true,
            selectedTeamMembers: uniqueArray,
            addedTeamMembers: uniqueArray,
          });
        } else {
          eachTeamMem.selected = false;
          this.setState({
            selectedAll: false,
            selectedTeamMembers: [],
            addedTeamMembers: [],
          });
        }
      });
    this.setState({ teamMembersList });
  }
  saveAndPublishClick = () => {
    this.setState({
      publishScreen: true,
      addMemScreen: false,
      surveyScreen: false,
    });
    this.props.getProgress(true, true, true);
  };
  handleEditTeamMembers = () => {
    this.setState({
      showTeamMemberModal: true,
      showCloseModal: false,
      dummyAddedUsers: [],
    });
  };
  ratingSelectClick = (star, smiles, slider, index) => {
    const { questionsArr } = this.state;
    var ratingType = star ? 1 : smiles ? 2 : slider && 3;
    questionsArr[index].ratingType = ratingType;
    questionsArr[index].rating.RatingType = ratingType;
    questionsArr[index].rating.MinValue = "";
    questionsArr[index].rating.MaxValue = "";
    questionsArr[index].rating.minValError = false;
    questionsArr[index].rating.maxValError = false;
    this.setState({ questionsArr });
  };
  handleReminderUserChange = (event) => {
    const { t } = this.props;
    const { date } = this.state;
    const todayDate = new Date();
    let remindDays = event.target.value;
    let diff = moment.duration(moment(date).diff(moment(todayDate)));
    let daysDiff = parseInt(diff.asDays());
    if (daysDiff < remindDays) {
      this.setState({ dayError: true });
    } else {
      this.setState({
        [event.target.name]: event.target.value,
        dayError: false,
      });
    }
  };
  addClick = () => {
    const { pageNumber, pageSize } = this.state;
    this.setState({ showTeamMemberModal: true, showCloseModal: false });
    this.getOrgUsers(pageNumber, pageSize);
    this.getBusinessValues();
  };
  onCloseModal = () => {
    this.setState({
      showCloseModal: true,
    });
  };
  loadFunc = () => {
    const { pageNumber, pageSize } = this.state;
    setTimeout(async () => {
      await this.getOrgUsers(pageNumber + 1, pageSize, "pagination");
    }, 2000);
  };
  //----API Call's------
  createSurveyAPICall = (guid) => {
    const { date, day, time, selectedTeamMembers, description } = this.state;
    const { t } = this.props;
    let teamMemForAPI = [];
    selectedTeamMembers.length > 0 &&
      selectedTeamMembers.map((eachMem) => {
        var obj = {
          userID: eachMem.UserId,
          userName: eachMem.FullName,
          userEmail: eachMem.Email,
        };
        teamMemForAPI.push(obj);
      });
    let saveFinalSurvey = {
      title: description,
      dateFrom: DateFormatter(new Date()),
      dateTo: DateFormatter(date),
      participants: teamMemForAPI,
      reminderDays: day,
      reminderTime: TimeFormat(time),
      isPublic: false,
      publishDate: DateFormatter(new Date()),
      surveyeeID: "",
      surveyeeName: "",
      surveyeeEmail: "",
    };
    this.setState({ creating: true });
    new Api(GetAPIHeader(Storage.getAccessToken())).v31
      .sendSurveyCreate(guid, saveFinalSurvey)
      .then((response) => {
        ToastsStore.success(t("survey.surveyCreationMsg"), 3000);
        setTimeout(() => {
          this.props.history.push("/survey");
          this.setState({ creating: false });
        }, 3000);
      })
      .catch((err) => {
        ToastsStore.error(err.Message, 3000);
        this.setState({ creating: false });
      });
  };
  saveSurvey = (type) => {
    const {
      surveyTitle,
      category,
      questionsArr,
      guid,
      description,
      isAnonymous,
    } = this.state;
    const { t } = this.props;
    var reqParamsfromQArray = [];
    let ratingErr = false;
    let choicesErr = false;
    questionsArr.length > 0 &&
      questionsArr.map((eachQsn) => {
        if (eachQsn.questionType === "questionsimple") {
          reqParamsfromQArray.push({
            sguid: null,
            isRequired: true,
            questionText: eachQsn.question,
            order: eachQsn.order,
            questionType: eachQsn.questionType,
            simple: eachQsn.simple,
          });
        } else if (eachQsn.questionType === "questionmultichoice") {
          var choices = [];
          eachQsn.multipleChoice.values.length > 0 &&
            eachQsn.multipleChoice.values.map((eachChoice, choiceIdx) => {
              if (eachChoice.text !== "") {
                // choicesErr = false
                eachChoice.multiChoiceError = false;
                var obj = { value: eachChoice.text, order: choiceIdx + 1 };
                choices.push(obj);
                this.setState({ questionsArr: questionsArr });
              } else {
                // choicesErr = true;
                eachChoice.multiChoiceError = true;
                this.setState({ questionsArr: questionsArr });
              }
            });
          reqParamsfromQArray.push({
            sguid: null,
            isRequired: true,
            questionText: eachQsn.question,
            order: eachQsn.order,
            questionType: eachQsn.questionType,
            multipleChoice: {
              isMultipleSelection: eachQsn.multipleChoice.isMultipleSelection,
              isRanking: false,
              values: choices,
            },
          });
        } else if (eachQsn.questionType === "questionrating") {
          if (eachQsn.rating.RatingType === 2) {
            reqParamsfromQArray.push({
              sguid: null,
              isRequired: true,
              questionText: eachQsn.question,
              order: eachQsn.order,
              questionType: eachQsn.questionType,
              rating: {
                RatingType: eachQsn.rating.RatingType,
                Ratingvalue: "",
                order: 1,
                MinValue: "",
                MaxValue: "",
              },
            });
          } else {
            reqParamsfromQArray.push({
              sguid: null,
              isRequired: true,
              questionText: eachQsn.question,
              order: eachQsn.order,
              questionType: eachQsn.questionType,
              rating: {
                RatingType: eachQsn.rating.RatingType,
                Ratingvalue: "",
                order: 1,
                MinValue: eachQsn.rating.MinValue,
                MaxValue: eachQsn.rating.MaxValue,
              },
            });
            // }
          }
          this.setState({ questionsArr: questionsArr });
        }
      });
    let createTemplate = {
      surveyTitle: surveyTitle,
      surveyDescription: description,
      templateCategorySguid: category.sguid,
      isAnonymous: isAnonymous,
      isSurveyeeRequired: false,
      isJobCriteriaRequired: false,
      isAdminOnly: false,
      messageSubject: "I value your opinion. A lot.",
      messageContent:
        "<p>Hi {Name},</p><p>I value your opinions a lot and want to know what you think about your colleague.</p><p>Your feedback helps us know how to help them improve, and make our workplace better.</p><p>Go to the link below to give your colleague some helpful feedback.</p><p><br></p><p>{SurveyLink}</p><p><br></p><p>Regards,</p><p>{CompanyName}</p>",
      sections: [
        {
          sguid: null,
          sectionNumber: 1,
          sectionTitle: surveyTitle,
          questions: reqParamsfromQArray,
        },
      ],
    };
    if (guid === "") {
      this.setState({ creating: true });
      new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .surveyCreate2(createTemplate)
        .then((response) => {
          this.setState({ guid: response.sguid, creating: false });
          ToastsStore.success(t("survey.templateCreationMsg"), 3000);
          if (type === "publish") {
            this.createSurveyAPICall(response.sguid);
          }
        })
        .catch((err) => {
          ToastsStore.error(err.Message, 3000);
          this.setState({ creating: false });
        });
    } else {
      this.setState({ creating: true });
      if (type === "publish") {
        this.createSurveyAPICall(guid);
      } else {
        new Api(GetAPIHeader(Storage.getAccessToken())).v31
          .surveyEdit(guid, createTemplate)
          .then((response) => {
            this.setState({ creating: false });
            ToastsStore.success(t("survey.templateCreationMsg"), 3000);
          })
          .catch((err) => {
            this.setState({ creating: false });
            ToastsStore.error(err.Message, 3000);
          });
      }
    }
  };

  whetherSelected(eachUser) {
    const { addedTeamMembers, selectedAll } = this.state;
    if (selectedAll) {
      return selectedAll ? true : false;
    } else {
      return addedTeamMembers.some((el) => el.UserId === eachUser.UserId);
    }
  }

  getOrgUsers(pageNumber, pageSize, type) {
    const UserProfile = Storage.getProfile();
    const {
      teamMembersList,
      userSearchTerm,
      filteredUnitValues,
      selectedAll,
      selectedTeamMembers,
      addedTeamMembers,
    } = this.state;
    var responseArr = [];
    if (this.state.hasMore === true || type === "filter" || type === "search") {
      this.setState({ pageNumber: pageNumber });
      if (type === "pagination") {
        // do nothing
      } else if (type === "search") {
        this.setState({ modalLoading: 1 });
      } else {
        this.setState({ modalLoading: 1 });
      }
      new Api(GetAPIHeader(Storage.getAccessToken())).v31
        .getUserProfile(
          {
            UnitValuesIds: filteredUnitValues,
          },
          {
            pageNumber: pageNumber,
            pageSize: pageSize,
            ...(userSearchTerm && { username: userSearchTerm }),
            status: 1,
          }
        )
        .then((response) => {
          this.setState({ modalLoading: 0 });
          if (response.Result.length > 0) {
            response.Result.map((obj) => {
              if (obj.Status === "Active") {
                let teamMemberObj = {
                  ImageUrl: obj.ImageUrl,
                  FullName: obj.FullName,
                  Position: obj.Position,
                  Email: obj.Email,
                  UserId: obj.UserId,
                  selected: this.whetherSelected(obj),
                  BusinessUnits: obj.BusinessUnits,
                };
                responseArr.push(teamMemberObj);
              }
            });
            let removeIndex = responseArr
              .map((item) => item.Email)
              .indexOf(UserProfile.email);
            if (removeIndex > -1) {
              responseArr.splice(removeIndex, 1);
            }
            let finalList;
            if (type === "search" || type === "filter") {
              finalList = responseArr;
            } else {
              finalList = [...teamMembersList, ...responseArr];
            }
            let cloneArr = [...finalList];
            if (selectedAll) {
              this.setState({
                selectedTeamMembers: cloneArr,
                addedTeamMembers: cloneArr,
              });
            }

            this.setState({
              teamMembersList: finalList,
              notFilterd: finalList,
            });
            if (
              response.Result.length < pageSize ||
              response.Total === pageSize ||
              response.Total === finalList.length
            ) {
              this.setState({ hasMore: false, pageNumber: 1 });
            } else {
              this.setState({ hasMore: true });
            }
          } else {
            this.setState({ teamMembersList: response.Result, hasMore: false });
          }
        })
        .catch((err) => {
          ToastsStore.error(err.Message, 3000);
          this.setState({ modalLoading: 0 });
        });
    }
  }
  getBusinessValues() {
    const { businessUnitVals } = this.state;
    let obj = { UnitTypeIds: [], UnitValueIds: [] };
    new Api(GetAPIHeader(Storage.getAccessToken())).v31
      .getBusinessValues(obj)
      .then((response) => {
        response.length > 0 &&
          response.map((eachcat) => {
            eachcat.UnitVlaue.length > 0 &&
              eachcat.UnitVlaue.map((eachUnitVal) => {
                businessUnitVals.push(eachUnitVal);
                this.setState({ businessUnitVals: businessUnitVals });
              });
          });
      })
      .catch((err) => {
        ToastsStore.error(err.Message, 3000);
      });
  }
  //----Render Methods------
  renderSelectList(qsnIndex) {
    const {
      draggingChoiceIdx,
      draggingState,
      choiceDuplicateErrMsg,
      duplicateIdx,
      choiceEmptyErrMsg,
      errEmptyChoiceIdx,
      selectedChoiceEle,
      selectedChoiceIndex,
      questionsArr,
    } = this.state;
    var choicesArr = questionsArr[qsnIndex].multipleChoice.values;
    const { t } = this.props;
    var selectedQsnType =
      questionsArr[qsnIndex].multipleChoice.isMultipleSelection;
    return (
      <>
        <p className="normal font-weight-bold mb-2">{t("survey.addChoices")}</p>
        <div className="form-group col-12 d-flex pl-0">
          <div
            className="d-flex pointer mr-4"
            onClick={() => {
              questionsArr[qsnIndex].multipleChoice.isMultipleSelection = false;
              this.setState({
                singleChoiceSelected: true,
                multiChoiceSelected: false,
              });
            }}
          >
            {!selectedQsnType ? (
              <div className="circle-primary mr-1 mt-1" />
            ) : (
              <div className="circle-gray mr-1 mt-1" />
            )}
            <label
              htmlFor="singleChoice"
              className={
                !selectedQsnType
                  ? "small font-weight-bold ml-2 pointer text-primary"
                  : "small font-weight-bold ml-2 pointer text-gray"
              }
            >
              {t("survey.singleChoice")}
            </label>
          </div>
          <div
            className="d-flex pointer"
            onClick={() => {
              questionsArr[qsnIndex].multipleChoice.isMultipleSelection = true;
              this.setState({ questionsArr });
            }}
          >
            {!selectedQsnType ? (
              <div className="circle-gray mr-1 mt-1" />
            ) : (
              <div className="circle-primary mr-1 mt-1" />
            )}
            <label
              htmlFor="multipleChoice"
              className={
                !selectedQsnType
                  ? "small font-weight-bold ml-2 pointer text-gray"
                  : "small font-weight-bold ml-2 pointer text-primary"
              }
            >
              {t("survey.multipleChoice")}
            </label>
          </div>
        </div>
        <DragDropContext
          onDragStart={(param) => {
            this.setState({
              draggingState: true,
              draggingChoiceIdx: param.source.index,
            });
          }}
          onDragEnd={(param) => this.handleOnDragEnd(param, qsnIndex)}
        >
          <Droppable droppableId="droppable-1">
            {(provided) => (
              <div
                className="form-group col-12 px-0"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {choicesArr.map((choice, indx) => {
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
                              class="fas fa-arrows-alt-v"
                              {...provided.dragHandleProps}
                              style={
                                draggingState && draggingChoiceIdx === indx
                                  ? { color: "#0062ff", marginRight: 10 }
                                  : { color: "#888", marginRight: 10 }
                              }
                              data-toggle="tooltip"
                              data-placement="top"
                              title={t("polls.dragTooltip")}
                            />
                            {!selectedQsnType ? (
                              <input
                                type="radio"
                                style={{ left: "32px" }}
                                className="position-relative disabled-group"
                                id={indx}
                              />
                            ) : (
                              <input
                                className="position-relative disabled-group"
                                style={{ left: "32px" }}
                                type="checkbox"
                              />
                            )}
                            <input
                              type="text"
                              style={
                                choiceDuplicateErrMsg &&
                                duplicateIdx.includes(indx)
                                  ? { border: "2px solid", boxShadow: "none" }
                                  : { boxShadow: "none" }
                              }
                              className={
                                choiceDuplicateErrMsg &&
                                duplicateIdx.includes(indx)
                                  ? "form-control bg-white form-control-md normal input-field border-danger pl-5 pr-5"
                                  : "form-control form-control-md normal bg-white input-field pl-5 pr-5"
                              }
                              id="pollChoice"
                              name="pollChoice"
                              autoComplete="off"
                              ref={this.choiceInput}
                              placeholder={choice.placeHolder}
                              maxLength={75}
                              onClick={() =>
                                this.setState({
                                  selectedChoiceEle: choice.text,
                                  selectedChoiceIndex: indx,
                                })
                              }
                              onMouseDown={() =>
                                this.setState({
                                  selectedChoiceEle: choice.text,
                                  selectedChoiceIndex: indx,
                                })
                              }
                              onChange={(evt) =>
                                this.handleChoiceChange(evt, indx, qsnIndex)
                              }
                              value={choice.text}
                            />
                            {!(indx === 1 || indx === 0) && (
                              <i
                                className="far fa-times-circle text-gray fa-lg pointer position-absolute"
                                style={{ left: "339px", right: "18px" }}
                                onClick={() => {
                                  this.onRemoveChoice(indx, qsnIndex);
                                }}
                              ></i>
                            )}
                          </div>
                          <div className="row">
                            <div className="col-md-8 pr-0">
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
                              {choiceEmptyErrMsg && errEmptyChoiceIdx == indx && (
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
                              {choice.multiChoiceError && (
                                <small>
                                  <div
                                    className="d-flex align-items-center"
                                    style={{ marginLeft: 30 }}
                                  >
                                    <i className="fas fa-exclamation-circle text-danger" />
                                    <p className="text-danger ml-1">
                                      {t("survey.emptyValidation")}
                                    </p>
                                  </div>
                                </small>
                              )}
                            </div>
                            {selectedChoiceIndex == indx && (
                              <div className="col-md-4">
                                <small
                                  className="float-right"
                                  style={{ color: "#666" }}
                                >
                                  {selectedChoiceEle.length} / {maxChoiceCount}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                  // })
                  // )
                })}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <div className="col-12 d-flex px-0 my-2 justify-content-between">
          <div class="form-check mb-3 ml-5 pr-0">
            <input
              class="form-check-input pointer"
              type="checkbox"
              checked={false}
            />
            <div>
              <label class="form-check-label small ml-2 font-weight-bold">
                {t("survey.addOther")}
              </label>
              <p className="text-gray ml-2" style={{ fontSize: "10px" }}>
                {t("survey.commentsFiled")}
              </p>
            </div>
          </div>

          <div onClick={() => this.onAddChoice(qsnIndex)}>
            <button
              className={
                choicesArr.length > 5
                  ? "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal"
                  : "py-2 app-blue-badge-pill blue-thick-border btn-border-radius normal"
              }
              disabled={choicesArr.length > 5 ? true : false} //#999
              style={{ lineHeight: "unset", height: "40px" }}
            >
              <span
                className={choicesArr.length > 5 ? "text-gray" : "text-primary"}
              >
                {t("common.add")}
              </span>
              <i
                className={
                  choicesArr.length > 5
                    ? "fa fa-plus fa-lg ml-3 text-gray"
                    : "fa fa-plus fa-lg ml-3 text-primary"
                }
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </div>
      </>
    );
  }
  renderRating(index) {
    const { questionsArr } = this.state;
    const { t } = this.props;
    var ratingType = this.state.questionsArr[index].rating.RatingType;
    return (
      <>
        <div className="form-group col-12 d-flex pl-0">
          <div
            className="d-flex pointer mr-4"
            onClick={() => this.ratingSelectClick(true, false, false, index)}
          >
            {ratingType === 1 ? (
              <div className="circle-primary mr-1 mt-1" />
            ) : (
              <div className="circle-gray mr-1 mt-1" />
            )}
            <label
              htmlFor="singleChoice"
              className={
                ratingType === 1
                  ? "small font-weight-bold ml-2 pointer text-primary"
                  : "small font-weight-bold ml-2 pointer text-gray"
              }
            >
              {t("survey.star")}
            </label>
          </div>
          <div
            className="d-flex pointer mr-4"
            onClick={() => this.ratingSelectClick(false, true, false, index)}
          >
            {ratingType === 2 ? (
              <div className="circle-primary mr-1 mt-1" />
            ) : (
              <div className="circle-gray mr-1 mt-1" />
            )}
            <label
              htmlFor="multipleChoice"
              className={
                ratingType === 2
                  ? "small font-weight-bold ml-2 pointer text-primary"
                  : "small font-weight-bold ml-2 pointer text-gray"
              }
            >
              {t("survey.smiles")}
            </label>
          </div>
          <div
            className="d-flex pointer"
            onClick={() => this.ratingSelectClick(false, false, true, index)}
          >
            {ratingType === 3 ? (
              <div className="circle-primary mr-1 mt-1" />
            ) : (
              <div className="circle-gray mr-1 mt-1" />
            )}
            <label
              htmlFor="multipleChoice"
              className={
                ratingType === 3
                  ? "small font-weight-bold ml-2 pointer text-primary"
                  : "small font-weight-bold ml-2 pointer text-gray"
              }
            >
              {t("survey.slider")}
            </label>
          </div>
        </div>
        {ratingType === 1 && (
          <>
            <StarRatings
              rating={0}
              numberOfStars={5}
              starDimension="28px"
              name="rating"
              starSpacing="2px"
              starHoverColor="#fff"
            />
            <div className="d-flex my-3">
              <div className="d-block mr-3">
                <input
                  type="text"
                  className={
                    questionsArr[index].rating.minValError
                      ? "form-control form-control-lg normal bg-white pl-2 normal-cursor border-danger"
                      : "form-control form-control-lg normal bg-white pl-2 normal-cursor"
                  }
                  placeholder={t("survey.minValue")}
                  id="minValue"
                  name="minValue"
                  onChange={(evt) =>
                    this.handleChangeQsn(evt, index, "minrating")
                  }
                  maxLength={maxCount}
                  value={questionsArr[index].rating.MinValue}
                />
                <div
                  className={
                    questionsArr[index].rating.minValError &&
                    "d-flex justify-content-between"
                  }
                >
                  {questionsArr[index].rating.minValError && (
                    <small className="float-left">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-circle text-danger" />
                        <p className="text-danger ml-1">
                          {t("survey.emptyValidation")}
                        </p>
                      </div>
                    </small>
                  )}
                  <small className="float-right">
                    {questionsArr[index].rating.MinValue
                      ? questionsArr[index].rating.MinValue.length
                      : 0}{" "}
                    / {maxCount}
                  </small>
                </div>
              </div>
              <div className="d-block">
                <input
                  type="text"
                  className={
                    questionsArr[index].rating.maxValError
                      ? "form-control form-control-lg normal bg-white pl-2 normal-cursor border-danger"
                      : "form-control form-control-lg normal bg-white pl-2 normal-cursor"
                  }
                  placeholder={t("survey.maxValue")}
                  id="maxValue"
                  name="maxValue"
                  onChange={(evt) =>
                    this.handleChangeQsn(evt, index, "maxrating")
                  }
                  maxLength={maxCount}
                  value={questionsArr[index].rating.MaxValue}
                />
                <div
                  className={
                    questionsArr[index].rating.maxValError &&
                    "d-flex justify-content-between"
                  }
                >
                  {questionsArr[index].rating.maxValError && (
                    <small className="float-left">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-circle text-danger" />
                        <p className="text-danger ml-1">
                          {t("survey.emptyValidation")}
                        </p>
                      </div>
                    </small>
                  )}
                  <small className="float-right">
                    {questionsArr[index].rating.MaxValue
                      ? questionsArr[index].rating.MaxValue.length
                      : 0}{" "}
                    / {maxCount}
                  </small>
                </div>
              </div>
            </div>
          </>
        )}
        {ratingType === 2 && (
          <>
            <div className="d-flex mt-3 icon-large">
              <div className="mr-4">
                <i class="fal fa-frown ml-1"></i>
                <p
                  className="normal font-weight-light text-gray mt-1 ml-1"
                  style={{ fontFamily: "Inter" }}
                >
                  {t("survey.poor")}
                </p>
              </div>
              <div className="mr-4">
                <i class="fal fa-meh ml-1"></i>
                <p
                  className="normal font-weight-light text-gray mt-1 ml-1"
                  style={{ fontFamily: "Inter" }}
                >
                  {t("survey.okay")}
                </p>
              </div>
              <div>
                <i class="fal fa-smile ml-1"></i>
                <p
                  className="normal font-weight-light text-gray mt-1 ml-1"
                  style={{ fontFamily: "Inter" }}
                >
                  {t("survey.good")}
                </p>
              </div>
            </div>
          </>
        )}
        {ratingType === 3 && (
          <>
            <div className="input-range">
              <input
                type="range"
                ref="inputRangeRef"
                className="input-range__slider"
                min="0"
                max="0"
                step=".1"
                defaultValue="0"
              />
            </div>
            <div className="d-flex justify-content-between">
              <small>0</small>
              <small>10</small>
            </div>
            <div className="d-flex my-3">
              <div className="d-block mr-3">
                <input
                  type="text"
                  className={
                    questionsArr[index].minValSliderEmptyErr
                      ? "form-control form-control-lg normal bg-white pl-2 normal-cursor border-danger"
                      : "form-control form-control-lg normal bg-white pl-2 normal-cursor"
                  }
                  placeholder={t("survey.minValue")}
                  onChange={(evt) =>
                    this.handleChangeQsn(evt, index, "minslider")
                  }
                  value={questionsArr[index].rating.MinValue}
                  maxLength={maxCount}
                />
                <div
                  className={
                    questionsArr[index].rating.minValError &&
                    "d-flex justify-content-between"
                  }
                >
                  {questionsArr[index].rating.minValError && (
                    <small className="float-left">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-circle text-danger" />
                        <p className="text-danger ml-1">
                          {t("survey.emptyValidation")}
                        </p>
                      </div>
                    </small>
                  )}
                  <small className="float-right">
                    {questionsArr[index].rating.MinValue
                      ? questionsArr[index].rating.MinValue.length
                      : 0}{" "}
                    / {maxCount}
                  </small>
                </div>
              </div>
              <div className="d-block">
                <input
                  type="text"
                  className={
                    questionsArr[index].maxValSliderEmptyErr
                      ? "form-control form-control-lg normal bg-white pl-2 normal-cursor border-danger"
                      : "form-control form-control-lg normal bg-white pl-2 normal-cursor"
                  }
                  placeholder={t("survey.maxValue")}
                  onChange={(evt) =>
                    this.handleChangeQsn(evt, index, "maxslider")
                  }
                  value={questionsArr[index].rating.MaxValue}
                  maxLength={maxCount}
                />
                <div
                  className={
                    questionsArr[index].rating.maxValError &&
                    "d-flex justify-content-between"
                  }
                >
                  {questionsArr[index].rating.maxValError && (
                    <small className="float-left">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-circle text-danger" />
                        <p className="text-danger ml-1">
                          {t("survey.emptyValidation")}
                        </p>
                      </div>
                    </small>
                  )}
                  <small className="float-right">
                    {questionsArr[index].rating.MaxValue
                      ? questionsArr[index].rating.MaxValue.length
                      : 0}{" "}
                    / {maxCount}
                  </small>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }
  renderDate() {
    const { t } = this.props;
    return (
      <div>
        <div className="col-6 px-0">
          <label for="date" className="normal font-weight-bold mt-1">
            {t("survey.selectDate")}
          </label>
          <input
            type="text"
            className="form-control form-control-lg normal bg-white pl-3 normal-cursor"
            placeholder="DD/MM/YYYY"
            disabled
          ></input>
        </div>
      </div>
    );
  }
  renderquestionsArr() {
    const { t } = this.props;
    const { questionsArr, selectedQuestionIndex, disbalingAddNextQsn } =
      this.state;
    return (
      <>
        <p className="font-weight-bold large mt-5 mb-0">
          {t("survey.step1")}
          {": "}
          {t("survey.createQuestionnaire")}
        </p>
        {questionsArr.map((eachQuestion, index) => (
          <div>
            <div
              className={
                index == 0
                  ? "d-flex justify-content-between mt-3"
                  : "d-flex justify-content-between mt-5"
              }
            >
              <p className={"normal font-weight-bold"}>
                {eachQuestion.addQuestion} {index + 1}
              </p>
              {index !== 0 && (
                <div class="d-flex">
                  <p className="small text-gray">
                    {t("survey.removeQuestion")}
                  </p>
                  <i
                    class="far fa-times-circle text-gray fa-lg  pointer ml-2 mt-1"
                    onClick={() => this.onRemoveQsn(index)}
                  ></i>
                </div>
              )}
            </div>
            <div className="col-6 my-2 px-0">
              <Select
                value={[eachQuestion.selectedQsnType]}
                options={eachQuestion.options}
                styles={customStyles}
                onChange={(event) => {
                  this.setState({ questionsArr });
                  if (event.value === "Select List") {
                    questionsArr[index].showSelectList = true;
                    questionsArr[index].showRating = false;
                    questionsArr[index].showDate = false;
                    questionsArr[index].questionType = "questionmultichoice";
                    questionsArr[index].selectedQsnType = {
                      value: "Select List",
                      label: "Select List",
                    };
                    this.setState({ questionsArr });
                  } else if (event.value === "Rating") {
                    questionsArr[index].showSelectList = false;
                    questionsArr[index].showRating = true;
                    questionsArr[index].showDate = false;
                    questionsArr[index].questionType = "questionrating";
                    questionsArr[index].selectedQsnType = {
                      value: "Rating",
                      label: "Rating",
                    };
                    this.setState({ questionsArr });
                  } else if (event.value === "Date") {
                    questionsArr[index].showSelectList = false;
                    questionsArr[index].showRating = false;
                    questionsArr[index].showDate = true;
                    questionsArr[index].questionType = "questionsimple";
                    questionsArr[index].selectedQsnType = {
                      value: "Date",
                      label: "Date",
                    };
                    questionsArr[index].simple = { regName: "Date" };
                    this.setState({ questionsArr });
                  } else {
                    questionsArr[index].showSelectList = false;
                    questionsArr[index].showRating = false;
                    questionsArr[index].showDate = false;
                    questionsArr[index].selectedQsnType = {
                      value: "Text Box",
                      label: "Text Box",
                    };
                    questionsArr[index].simple = { regName: "None" };
                    this.setState({ questionsArr });
                  }
                }}
                // components={{ Option: IconOption }}
              />
            </div>
            <p className="small text-gray">{t("survey.maxTenQsns")}</p>
            <div className="col-12 my-3 px-0">
              <input
                type="text"
                className={
                  eachQuestion.qsnEmptyErr
                    ? "form-control form-control-lg normal bg-white border-danger pl-3 normal-cursor"
                    : "form-control form-control-lg normal bg-white pl-3 normal-cursor"
                }
                id="questionTitle"
                name="questionTitle"
                maxlength="180"
                placeholder={eachQuestion.placeHolder}
                onChange={(evt) => this.handleChangeQsn(evt, index, "question")}
                value={eachQuestion.question}
                onClick={() => this.setState({ selectedQuestionIndex: index })}
                onMouseDown={() =>
                  this.setState({ selectedQuestionIndex: index })
                }
              />
              <div className="row">
                <div className="col-8">
                  {eachQuestion.qsnEmptyErr && (
                    <small>
                      <div className="d-flex align-items-center ml-3">
                        <i className="fas fa-exclamation-circle text-danger" />
                        <p className="text-danger ml-1">
                          {t("survey.questionErrMsg")}
                        </p>
                      </div>
                    </small>
                  )}
                </div>
                {selectedQuestionIndex === index && (
                  <div className="col-4 d-flex flex-row-reverse">
                    <p
                      className="float-right mt-1"
                      style={{ fontSize: "12px" }}
                    >
                      {eachQuestion.questionLen} / {"180"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {eachQuestion.showSelectList && this.renderSelectList(index)}
            {eachQuestion.showRating && this.renderRating(index)}
            {eachQuestion.showDate && this.renderDate(index)}
            <div className="border-bottom mt-3"></div>
          </div>
        ))}
        <button
          onClick={this.onAddQuestion}
          className={
            disbalingAddNextQsn
              ? "py-2 my-3 app-blue-badge-pill bg-white btn-border-radius normal font-weight-light"
              : "py-2 my-3 app-blue-badge-pill border-0 outline-none btn-border-radius"
          }
          disabled={disbalingAddNextQsn ? true : false}
        >
          <span className={disbalingAddNextQsn ? "text-gray" : "text-primary"}>
            {t("survey.addNextQuestion")}
          </span>
        </button>
      </>
    );
  }
  renderSurvey() {
    const { t } = this.props;
    const {
      surveyTitle,
      category,
      description,
      isAnonymous,
      surveyTitleSelected,
      descriptionSelected,
    } = this.state;
    const { categoryList } = this.props;
    return (
      <>
        <div className="col-12 mb-3 px-0">
          <div className="form-group">
            <label for="title" className="large font-weight-bold mt-1">
              {t("survey.surveyTitle")}
            </label>
            <input
              type="text"
              className="form-control form-control-lg normal  bg-white pl-2 normal-cursor"
              id="surveyTitle"
              name="surveyTitle"
              maxlength="180"
              placeholder={t("survey.enterSurveyTitle")}
              onChange={this.handleChange}
              value={surveyTitle}
              onClick={() => this.setState({ surveyTitleSelected: true })}
              onMouseDown={() => this.setState({ surveyTitleSelected: true })}
            />
          </div>
          {surveyTitleSelected && (
            <p className="float-right mt-n2" style={{ fontSize: "12px" }}>
              {surveyTitle.length} / {"180"}
            </p>
          )}
        </div>
        <div className="col-6 mb-3 px-0">
          <div className="form-group">
            <label for="category" className="normal font-weight-bold mt-1">
              {t("survey.surveyCategory")}
            </label>
            <Select
              id={category.surveyId}
              value={category}
              onChange={(categoryVal) => {
                this.setState({
                  category: categoryVal,
                });
              }}
              options={categoryList}
              styles={customStyles}
              placeholder={t("survey.selCategory")}
            />
          </div>
        </div>
        <div className="col-12 px-0">
          <div className="form-group">
            <label for="description" className="normal font-weight-bold">
              {t("survey.description")}
            </label>
            <textarea
              className="form-control form-control-lg input-fields pt-2 pl-2"
              id="description"
              name="description"
              onChange={this.handleChange}
              value={description}
              maxlength="500"
              placeholder={t("survey.descriptionPH")}
              onClick={() => this.setState({ descriptionSelected: true })}
              onMouseDown={() => this.setState({ descriptionSelected: true })}
            ></textarea>
          </div>
          {descriptionSelected && (
            <small className="float-right mt-n2" style={{ fontSize: "12px" }}>
              {description.length} / {"500"}
            </small>
          )}
        </div>
        <div class="form-check mb-3 ml-4 px-0">
          <input
            class="form-check-input pointer"
            type="checkbox"
            value={isAnonymous}
            checked={isAnonymous}
            onClick={(e) => {
              this.isAnonymousClick(e);
            }}
          />
          <label class="form-check-label normal ml-2">
            {t("survey.anonymousSurvey")}
          </label>
        </div>
        <div className="border-bottom mb-3"></div>
      </>
    );
  }
  renderFooter() {
    const { t } = this.props;
    const {
      surveyTitle,
      category,
      creating,
      questionError,
      addMemScreen,
      publishScreen,
      selectedTeamMembers,
      dayError,
    } = this.state;
    return (
      <div className="d-block d-sm-flex d-md-flex d-lg-flex justify-content-between p-3">
        <div className="mb-3 mb-sm-0 mb-md-0 mb-lg-0">
          {addMemScreen || publishScreen ? (
            <Button
              className="font-weight-bold small bg-white text-primary blue-light-border"
              onClick={this.handleBack}
            >
              {"Back"}
            </Button>
          ) : (
            <button
              className={
                surveyTitle !== "" && category
                  ? "py-2 app-blue-badge-pill blue-light-border btn-border-radius normal font-weight-light"
                  : "py-2 app-blue-badge-pill bg-white btn-border-radius normal font-weight-light"
              }
              onClick={() => {
                this.saveSurvey("template");
              }}
            >
              <span
                className={
                  surveyTitle !== "" && category ? "text-primary" : "text-gray"
                }
              >
                {t("survey.saveAsTemaplate")}
              </span>
              {creating && (
                <span>
                  &nbsp;<i className="fa fa-spinner fa-spin"></i>
                </span>
              )}
            </button>
          )}
        </div>
        <div>
          {addMemScreen ? (
            <button
              className={
                selectedTeamMembers.length > 0 && !creating
                  ? "py-2 btn-primary btn-border-radius normal border-0 px-3"
                  : "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal border-0 px-3 font-weight-lighter"
              }
              onClick={this.saveAndPublishClick}
              disabled={
                selectedTeamMembers.length > 0 && !creating ? false : true
              }
            >
              <span
                className={
                  selectedTeamMembers.length > 0 && !creating
                    ? "text-white"
                    : "text-gray"
                }
              >
                {t("survey.saveAndPublish")}
              </span>
              {creating && (
                <span>
                  &nbsp;<i className="fa fa-spinner fa-spin"></i>
                </span>
              )}
            </button>
          ) : publishScreen ? (
            <button
              className={
                !dayError
                  ? "py-2 btn-primary btn-border-radius normal border-0 px-3"
                  : "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal border-0 px-3 font-weight-lighter"
              }
              onClick={() => {
                this.saveSurvey("publish");
              }}
              disabled={dayError}
            >
              <span className={!dayError ? "text-white" : "text-gray"}>
                {t("survey.publishNow")}
              </span>
              {creating && (
                <span>
                  &nbsp;<i className="fa fa-spinner fa-spin"></i>
                </span>
              )}
            </button>
          ) : (
            <button
              className={
                surveyTitle !== "" && category && !questionError
                  ? "py-2 btn-primary btn-border-radius normal border-0 px-3"
                  : "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal border-0 px-3 font-weight-lighter"
              }
              onClick={this.addMembers}
              disabled={
                surveyTitle !== "" && category && !questionError ? false : true
              }
            >
              <span
                className={
                  surveyTitle !== "" && category ? "text-white" : "text-gray"
                }
              >
                {t("survey.addMembers")}
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }
  renderAddMember() {
    const { t } = this.props;
    const remainingTeamMem = [];
    const { showTeamMemberModal, selectedTeamMembers, showAllTeamMembers } =
      this.state;
    return (
      <div>
        <p className="font-weight-bold large my-3">
          {t("survey.step2")}
          {": "}
          {t("survey.addMembers")}
        </p>
        <div className="d-flex justify-content-center mb-3">
          <img alt="" style={{ height: "130px" }} src={AddMembers} />
        </div>
        {showTeamMemberModal && this.renderTeamMemberModal()}
        {selectedTeamMembers.length === 0 ? (
          <>
            <p className="small font-weight-bold pb-3">
              {t("survey.addTeamMembers")}
            </p>
            <div className="app-card border">
              <div className="d-flex justify-content-between">
                <div className="d-flex icon-large">
                  <i class="fa fa-user"></i>
                  <p className="normal m-2" style={{ fontFamily: "Inter" }}>
                    {t("survey.none")}
                  </p>
                </div>
                <div>
                  <button
                    className="py-2 app-blue-badge-pill border-0 outline-none btn-border-radius"
                    style={{ lineHeight: "unset" }}
                    onClick={this.addClick}
                  >
                    {t("survey.add")}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="col-md-12 mt-3 px-0">
            <div className="form-group">
              <label className="small text-gray font-weight-bold">
                {t("survey.selectedTeamMembers")}
              </label>
              <div className="clsCompanyGoals normal-cursor">
                {!showAllTeamMembers ? (
                  <div className="d-flex">
                    {selectedTeamMembers.length > 0 && (
                      <div className="avatar-group d-flex">
                        {selectedTeamMembers.map(
                          (eachProfile, teamMemIndex) => {
                            if (teamMemIndex < 2) {
                              return (
                                <div className="d-flex flex-wrap">
                                  <ImageUtils
                                    src={eachProfile.ImageUrl}
                                    width={30}
                                    height={30}
                                    name={eachProfile.FullName}
                                    className="mr-2 mt-1"
                                  />
                                  <p className="normal mt-2 mr-2">
                                    {TruncateWithDynamicLen(
                                      eachProfile.FullName,
                                      30
                                    )}
                                  </p>
                                  <i
                                    className="far fa-times-circle text-gray fa-lg  pointer d-flex align-items-center mr-2"
                                    onClick={() => {
                                      this.onRemoveUser(eachProfile.UserId);
                                    }}
                                  ></i>
                                </div>
                              );
                            } else {
                              remainingTeamMem.push(eachProfile);
                              return null;
                            }
                          }
                        )}
                        {remainingTeamMem.length > 0 && (
                          <div
                            onClick={(e) => {
                              this.showAllTeamMembersClick(e, true);
                            }}
                          >
                            <Avatar className="small avatar-class mt-2 pointer">
                              {"+" + remainingTeamMem.length}
                            </Avatar>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="d-flex flex-wrap">
                    {selectedTeamMembers.map((eachProfile, index) => (
                      <div className="d-flex">
                        <ImageUtils
                          src={eachProfile.ImageUrl}
                          width={30}
                          height={30}
                          name={eachProfile.FullName}
                          className="mr-2 mt-1"
                        />
                        <p className="normal mt-2 mr-2">
                          {eachProfile.FullName}
                        </p>
                        <i
                          className="far fa-times-circle text-gray fa-lg  pointer d-flex align-items-center mr-2"
                          onClick={() => {
                            this.onRemoveUser(eachProfile.UserId);
                          }}
                        ></i>
                      </div>
                    ))}
                    <p class="float-right mt-2">
                      <img
                        alt=""
                        style={{
                          height: "24px",
                          width: "24px",
                          cursor: "pointer",
                        }}
                        src={ReviewerCloseIcon}
                        onClick={(e) => {
                          this.showAllTeamMembersClick(e, false);
                        }}
                      />
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {selectedTeamMembers.length > 0 ? (
          <>
            <div className="col-12 d-flex flex-row-reverse">
              <Button
                className="font-weight-bold small bg-white text-primary blue-light-border"
                onClick={this.handleEditTeamMembers}
              >
                {"Edit"}
              </Button>
            </div>
          </>
        ) : (
          <p className="small text-gray font-weight-bold">
            {t("survey.addOneOrMoreUsers")}
          </p>
        )}
      </div>
    );
  }
  displayConfirmationModal() {
    const { addedTeamMembers } = this.state;
    if (addedTeamMembers && addedTeamMembers.length > 0) {
      this.setState({ showCloseModal: true, showTeamMemberModal: false });
    } else {
      this.closeWarningPopup();
    }
  }
  renderTeamMemberModal() {
    const {
      teamMembersList,
      selectedTeamMembers,
      addedTeamMembers,
      modalLoading,
      businessUnitVals,
      dummyAddedUsers,
    } = this.state;
    const { t } = this.props;
    return (
      <div id="scrollableDiv">
        <Modal
          show={true}
          centered
          size="lg"
          aria-labelledby="contained-modal-title-vcenter"
          className="addmem_modal"
          // onHide={() => this.setState({showCloseModal: false, showTeamMemberModal: true})}
        >
          <div className="p-0">
            <Modal.Body
              className={""}
              style={{ borderRadius: "8px" }}
              scrollable={true}
            >
              <div className="row">
                <div className="col-md-12 px-0 mb-n2">
                  <div className="d-flex">
                    <h6 className="mb-3">{t("survey.selectTeamMembers")}</h6>
                    <i
                      className="fas fa-times fa-lg text-gray position-absolute pointer"
                      onClick={() => {
                        this.displayConfirmationModal();
                      }}
                      style={{ right: "4px" }}
                    ></i>
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      className="normal-cursor form-control form-control-md normal clsCompanyGoals bg-white pl-3 pb-3 border"
                      onChange={(evt) => {
                        this.setState({
                          userSearchTerm: evt.target.value,
                        });
                      }}
                      onKeyDown={this.onSearchUser}
                      placeholder={t("common.individualPlaceholder")}
                    />
                  </div>
                </div>
                <div className="col-6 d-flex align-items-end pl-2">
                  <div class="form-check ml-4 px-0 mt-n3">
                    <input
                      class="form-check-input pointer"
                      type="checkbox"
                      // value={isAnonymous}
                      checked={
                        teamMembersList.length > 0
                          ? teamMembersList.length ===
                            selectedTeamMembers.length
                          : false
                      }
                      onClick={(e) => {
                        this.selecteAllTeamMembers(e);
                      }}
                    />
                    <label class="form-check pl-0">
                      {t("survey.selectAll")}
                    </label>
                  </div>
                </div>
                <div className="col-6 d-flex flex-row-reverse mt-3 px-0">
                  <div>
                    <h6 className="normal">{t("survey.sortByBu")}</h6>
                    <div
                      className="input-group mb-2"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <div
                        className="position-absolute"
                        style={{
                          zIndex: "9",
                          marginTop: "12px",
                          right: "120px",
                        }}
                      >
                        <i className="icon-setup-1"></i>
                      </div>
                      <div className="bg-white border py-2 px-2 col-12 rounded">
                        <span className="small text-gray ml-4">
                          {t("survey.allEmployess")}
                        </span>
                      </div>
                    </div>
                    <div
                      className="dropdown-menu border-0 p-3 ml-n2"
                      style={{
                        boxShadow: "0px 0px 0px 2px rgb(239 239 239 / 50%)",
                        height: "250px",
                        overflow: "scroll",
                      }}
                    >
                      {businessUnitVals.length > 0 &&
                        businessUnitVals.map((eachCat) => (
                          <div className="form-check dropdown-item">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              name={eachCat.UnitValueName}
                              value={eachCat.UnitValueId}
                              onClick={this.onFilterUser}
                            />
                            <label class="form-check-label normal ml-2">
                              {eachCat.UnitValueName}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <div
                  style={{ height: "400px", overflow: "scroll" }}
                  className="w-100"
                >
                  {modalLoading ? (
                    <Loading />
                  ) : (
                    <InfiniteScroll
                      loadMore={this.loadFunc}
                      hasMore={this.state.hasMore}
                      initialLoad={false}
                      useWindow={false}
                      loader={
                        <div className="loader text-center" key={0}>
                          Loading ...
                        </div>
                      }
                    >
                      {teamMembersList.length > 0 ? (
                        teamMembersList.map((eachUser, i) => (
                          <div
                            className="col-md-12 pl-2 pt-0 pb-1 pr-2 bg-white my-2 rounded-xl"
                            style={{ overflow: "scroll" }}
                          >
                            <div className="d-flex justify-content-between">
                              <div className="d-flex ml-4 mt-3">
                                <input
                                  class="form-check-input mt-3 pointer"
                                  type="checkbox"
                                  value=""
                                  checked={eachUser.selected}
                                  onClick={(e) => {
                                    if (e.target.checked == true) {
                                      eachUser.selected = true;
                                      addedTeamMembers.push(eachUser);
                                      dummyAddedUsers.push(eachUser);
                                      this.setState({
                                        addedTeamMembers,
                                        selectedAll: false,
                                        dummyAddedUsers,
                                      });
                                    } else {
                                      let removeIndex = addedTeamMembers
                                        .map((item) => item.UserId)
                                        .indexOf(eachUser.UserId);
                                      eachUser.selected = false;
                                      addedTeamMembers.splice(removeIndex, 1);
                                      dummyAddedUsers.splice(removeIndex, 1);
                                      this.setState({
                                        addedTeamMembers,
                                        selectedAll: false,
                                        dummyAddedUsers,
                                      });
                                    }
                                  }}
                                />
                                <div className="d-flex ml-2">
                                  <ImageUtils
                                    src={eachUser.ImageUrl}
                                    width={40}
                                    height={40}
                                    name={eachUser.FullName}
                                    className="mr-2"
                                  />
                                  <div>
                                    <p className="small font-weight-bold">
                                      {eachUser.FullName}
                                    </p>
                                    <p className="normal text-gray">
                                      <BadgeWithAvatarCount
                                        data={eachUser.BusinessUnits}
                                        displayMultiple="1"
                                      />
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="d-flex align-items-center justify-content-center">
                          <h3>{"No Results Found"}</h3>
                        </div>
                      )}
                    </InfiniteScroll>
                  )}
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-12 d-flex flex-row-reverse px-0">
                  <button
                    className={
                      addedTeamMembers.length > 0
                        ? "py-2 btn-primary btn-border-radius normal border-0 px-3"
                        : "py-2 app-blue-badge-pill bg-dark-gray btn-border-radius normal border-0 px-3"
                    }
                    onClick={() => {
                      let addedMem = this.state.addedTeamMembers.map(
                        (recipient) => Object.assign({}, recipient)
                      );
                      this.setState({
                        showTeamMemberModal: false,
                        selectedTeamMembers: addedMem,
                        dummyAddedUsers: [],
                      });
                    }}
                    // disabled = {addedTeamMembers.length> 0   ? false : true}
                  >
                    <span
                      className={
                        addedTeamMembers.length > 0 ? "text-white" : "text-gray"
                      }
                    >
                      {t("survey.addParticipants")}
                      {" " + addedTeamMembers.length}
                    </span>
                  </button>
                </div>
              </div>
            </Modal.Body>
          </div>
        </Modal>
      </div>
    );
  }
  renderPublish() {
    const { t } = this.props;
    const { date, time, dayError } = this.state;
    return (
      <div>
        <p className="font-weight-bold large my-3">
          {t("survey.step3")}
          {": "}
          {t("survey.saveAndPublish")}
        </p>
        <div className="col-6 px-0">
          <label for="date" className="normal font-weight-bold mt-1">
            {t("survey.surveyClosingDate")}
          </label>
          <FilledDatePicker
            formLabel={""}
            disablePast={true}
            value={date}
            name="date"
            onChange={(val) =>
              this.setState({ date: val, dayError: false, day: 0 })
            }
            className="MuiOutlinedInput-input bg-white border normal"
            placeHolder={"strings.feedback.giveModalDatePH"}
            minDate={moment(new Date(), "DD/MM/YYYY").add(1, "days")}
          />
        </div>
        <div className="row mt-3">
          <div className="col-5">
            <label for="setRemainder" className="normal font-weight-bold mt-1">
              {t("survey.setRemainder")}
            </label>
            <input
              type="number"
              className={
                "form-control form-control-lg normal bg-white pl-2 normal-cursor"
              }
              id="day"
              min="0"
              style={{ height: "56px" }}
              onKeyDown={(e) => {
                let inputKeyCode = e.keyCode ? e.keyCode : e.which;
                if (inputKeyCode != null) {
                  if (
                    inputKeyCode === 45 ||
                    inputKeyCode === 189 ||
                    inputKeyCode === 61 ||
                    inputKeyCode === 173 ||
                    inputKeyCode === 69 ||
                    inputKeyCode === 187 ||
                    inputKeyCode === 190
                  )
                    e.preventDefault();
                }
              }}
              placeholder={t("survey.day")}
              name="day"
              onChange={this.handleReminderUserChange}
              value={this.state.day}
            />
          </div>
          <div className="col-5">
            <label for="date" className="normal font-weight-bold mt-1">
              {t("survey.time")}
            </label>
            <FilledTimePicker
              disablePast={true}
              value={time}
              name="time"
              onChange={(val) => this.setState({ time: val })}
              className="bg-white MuiOutlinedInput-input border"
            />
          </div>
          <div className="col-2  mt-5">
            <i class="far fa-bell-on"></i>
          </div>
          {dayError && (
            <p className="text-danger ml-1 small">
              {t("survey.surveyDateValidationMsg")}
            </p>
          )}
        </div>
      </div>
    );
  }
  renderConfirmModal() {
    const { t } = this.props;
    return (
      <ConfirmPopup
        fromPages={true}
        message={t("feedback.warning")}
        onHide={() =>
          this.setState({ showCloseModal: false, showTeamMemberModal: true })
        }
        confirmClick={() => this.closeWarningPopup()}
      />
    );
  }
  render() {
    const { t } = this.props;
    const {
      surveyScreen,
      addMemScreen,
      publishScreen,
      loading,
      showCloseModal,
    } = this.state;
    return (
      <div className="">
        <ToastsContainer
          store={ToastsStore}
          position={ToastsContainerPosition.TOP_RIGHT}
        />
        <div className="row">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 d-grid">
            <div className="card border">
              <p className="small text-uppercase p-3">{t("survey.input")}</p>
              <div className="border-bottom"></div>
              <div
                style={{ height: "400px", overflow: "scroll" }}
                className="bg-gray px-4"
              >
                {loading ? (
                  <Loading />
                ) : (
                  <>
                    {surveyScreen && (
                      <>
                        {this.renderSurvey()}
                        {this.renderquestionsArr()}
                      </>
                    )}
                    {addMemScreen && this.renderAddMember()}
                    {publishScreen && this.renderPublish()}
                    {showCloseModal && this.renderConfirmModal()}
                  </>
                )}
              </div>
              {this.renderFooter()}
            </div>
          </div>
          <div
            className="col-12 col-sm-6 col-md-6 col-lg-6 d-grid
                    mt-3 mt-lg-0 mt-sm-0 mt-md-0 px-0"
          >
            <div className="app-card border d-flex align-items-center justify-content-center">
              <div>
                <div className="d-flex justify-content-center">
                  <img
                    alt=""
                    style={{ height: "200px" }}
                    src={CreateQuestionsBlank}
                    className="pointer"
                  />
                </div>
                <p className="normal font-weight-bold mt-5">
                  {t("survey.createAndPreview")}
                </p>
                <p className="normal mt-1 text-center">
                  {t("survey.shareYourSurvey")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation("translation")(withRouter(CreateNewTab));
